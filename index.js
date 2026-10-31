const dotenv = require('dotenv');
const { App, webApi } = require('@slack/bolt');

dotenv.config();

for (const key of ['SLACK_SIGNING_SECRET', 'SLACK_BOT_TOKEN', 'YOUR_USER_TOKEN', 'YOUR_USER_ID']) {
    if (!process.env[key]) {
        console.error(key + ' is missing or empty in .env');
        process.exit(1);
    }
}

const app = new App({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    token: process.env.SLACK_BOT_TOKEN,
    clientOptions: { attachOriginalToWebAPIRequestError: false }
});
const engagementUserId = process.env.YOUR_USER_ID;
const userClient = new webApi.WebClient(process.env.YOUR_USER_TOKEN, {
    retryConfig: { retries: 0 },
    attachOriginalToWebAPIRequestError: false
});
const messages = [process.env.MESSAGE, process.env.MESSAGE_2, process.env.MESSAGE_3]
    .filter(Boolean)
    .map((msg, i) => {
        const [label, ...rest] = msg.split('|||');
        return { label: label.trim(), template: rest.join('|||').trim(), actionId: 'welcome_msg_' + i };
    });

if (messages.length === 0) {
    console.error('Set at least one welcome message (MESSAGE) in .env');
    process.exit(1);
}
for (const msg of messages) {
    if (!msg.label || !msg.template) {
        console.error('Each welcome message needs the format "Label|||message text" in .env');
        process.exit(1);
    }
}
const welcomed = new Set();
const notified = new Set();

function titleCase(str) {
    str = str.toLowerCase();
    str = str.split(' ');

    for (let i = 0; i < str.length; i++) {
        str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
    }

    return str.join(' ');
}

function escapeSlack(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function logError(error) {
    console.error(error.code, error.message, error.data?.error ?? '');
}

process.on('unhandledRejection', error => {
    logError(error);
    process.exit(1);
});

app.error(async error => {
    logError(error);
    throw error;
});

(async () => {
    // Start the app
    await app.start(process.env.PORT || 3000);

    console.log('⚡️ Warm-welcome is running!');

    // team_join
    app.event('team_join', async ({ event, context }) => {
        if (notified.has(event.user.id)) {
            return;
        }
        notified.add(event.user.id);

        const name = event.user.real_name || event.user.profile?.display_name || event.user.name || '';

        try {
            // Open the DM with me
            let result = await app.client.conversations.open({
                token: context.botToken,
                users: engagementUserId
            });

            const imChannelId = result.channel.id;
            const message = escapeSlack(name || 'Someone') + ' joined Slack!';

            // Tell me who joined, with the welcome buttons
            result = await app.client.chat.postMessage({
                token: context.botToken,
                channel: imChannelId,
                text: message,
                blocks: [
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: message + ' Welcome the new user now?'
                        }
                    },
                    {
                        type: 'actions',
                        block_id: 'welcomeFolks',
                        elements: [
                            ...messages.map(msg => ({
                                type: 'button',
                                text: {
                                    type: 'plain_text',
                                    text: msg.label
                                },
                                style: 'primary',
                                action_id: msg.actionId,
                                value: event.user.id + ',' + name
                            })),
                            {
                                type: 'button',
                                text: {
                                    type: 'plain_text',
                                    text: 'Nope'
                                },
                                style: 'danger',
                                action_id: 'cancel',
                                value: name
                            }
                        ]
                    }
                ]
            });
        } catch (error) {
            notified.delete(event.user.id);
            logError(error);
        }
    });

    // Listen to welcome message buttons
    messages.forEach(msg => {
        app.action(msg.actionId, async ({ action, body, ack }) => {
            await ack();

            if (body.user.id !== engagementUserId) {
                return;
            }

            const [newUserId, ...nameParts] = action.value.split(',');
            const newUserName = nameParts.join(',');

            if (welcomed.has(newUserId)) {
                return;
            }

            const firstName = newUserName ? titleCase(newUserName.split(/[\s,]+/)[0]) : 'there';

            try {
                // Let me edit the message before it's sent
                await app.client.views.open({
                    trigger_id: body.trigger_id,
                    view: {
                        type: 'modal',
                        callback_id: 'welcome_edit',
                        private_metadata: JSON.stringify({ userId: newUserId, name: newUserName, label: msg.label, channel: body.channel.id, ts: body.message.ts }),
                        title: { type: 'plain_text', text: 'Welcome message' },
                        submit: { type: 'plain_text', text: 'Send' },
                        close: { type: 'plain_text', text: 'Cancel' },
                        blocks: [
                            {
                                type: 'input',
                                block_id: 'message',
                                label: { type: 'plain_text', text: 'Message to ' + (newUserName || 'Someone') },
                                element: {
                                    type: 'plain_text_input',
                                    action_id: 'text',
                                    multiline: true,
                                    initial_value: msg.template.replace('{{name}}', () => firstName)
                                }
                            }
                        ]
                    }
                });
            } catch (error) {
                logError(error);
            }
        });
    });

    // Listen to the edited welcome message
    app.view('welcome_edit', async ({ ack, body, view }) => {
        await ack();

        if (body.user.id !== engagementUserId) {
            return;
        }

        const { userId, name, label, channel, ts } = JSON.parse(view.private_metadata);

        if (welcomed.has(userId)) {
            return;
        }
        welcomed.add(userId);
        let sent = false;

        try {
            // Retrieve the ID for the direct message to the new member
            const result = await userClient.conversations.open({
                users: userId
            });

            // Send the welcome message
            await userClient.chat.postMessage({
                channel: result.channel.id,
                link_names: true,
                text: view.state.values.message.text.value,
                as_user: 'yes',
                unfurl_links: false,
                unfurl_media: false
            });
            sent = true;

            const confirmation = '*' + label + '* message sent to *' + escapeSlack(name || 'Someone') + '*';
            await app.client.chat.update({
                channel,
                ts,
                text: confirmation,
                blocks: [{ type: 'section', text: { type: 'mrkdwn', text: confirmation } }]
            });
        } catch (error) {
            logError(error);

            if (!sent) {
                welcomed.delete(userId);

                // Tell me the welcome wasn't sent, under the message with the buttons
                try {
                    await app.client.chat.postMessage({
                        channel,
                        thread_ts: ts,
                        text: '⚠️ Couldn\'t send the welcome message to *' + escapeSlack(name || 'Someone') + '*. Click the button again to retry.'
                    });
                } catch (notifyError) {
                    logError(notifyError);
                }
            }
        }
    });

    // Listen to cancelling
    app.action('cancel', async ({ action, body, ack, respond }) => {
        await ack();

        if (body.user.id !== engagementUserId) {
            return;
        }

        try {
            await respond({
                text: 'Message *not* sent to ' + escapeSlack(action.value || 'Someone'),
                replace_original: true
            });
        } catch (error) {
            logError(error);
        }
    });
})().catch(error => {
    logError(error);
    process.exit(1);
});
