const dotenv = require('dotenv');
const { App } = require('@slack/bolt');

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
const engagementUserToken = process.env.YOUR_USER_TOKEN;
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

(async () => {
    // Start the app
    await app.start(process.env.PORT || 3000);

    console.log('⚡️ Warm-welcome is running!');

    // team_join
    app.event('team_join', async ({ event, context }) => {
        if (context.retryNum) {
            return;
        }

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
            logError(error);
        }
    });

    // Listen to welcome message buttons
    messages.forEach(msg => {
        app.action(msg.actionId, async ({ action, body, ack, respond }) => {
            await ack();

            if (body.user.id !== engagementUserId) {
                return;
            }

            const [newUserId, ...nameParts] = action.value.split(',');
            const newUser = [newUserId, nameParts.join(',')];

            if (welcomed.has(newUser[0])) {
                return;
            }
            welcomed.add(newUser[0]);
            let sent = false;

            try {
                // Retrieve the ID for the direct message to the new member
                let result = await app.client.conversations.open({
                    token: engagementUserToken,
                    users: newUser[0]
                });
                const imChannelId = result.channel.id;

                // Send the welcome message
                result = await app.client.chat.postMessage({
                    token: engagementUserToken,
                    channel: imChannelId,
                    link_names: true,
                    text: msg.template.replace('{{name}}', () => newUser[1] ? escapeSlack(titleCase(newUser[1].split(/[\s,]+/)[0])) : 'there'),
                    as_user: 'yes',
                    unfurl_links: false,
                    unfurl_media: false
                });
                sent = true;

                await respond({
                    text: '*' + msg.label + '* message sent to *' + escapeSlack(newUser[1] || 'Someone') + '*',
                    replace_original: true
                });
            } catch (error) {
                if (!sent) {
                    welcomed.delete(newUser[0]);
                }
                logError(error);
            }
        });
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
