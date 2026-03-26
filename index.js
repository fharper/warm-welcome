const dotenv = require('dotenv');
const { App } = require('@slack/bolt');

dotenv.config();

const app = new App({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    token: process.env.SLACK_BOT_TOKEN
});
const engagementUserId = process.env.YOUR_USER_ID;
const engagementUserToken = process.env.YOUR_USER_TOKEN;
const messages = [process.env.MESSAGE, process.env.MESSAGE_2, process.env.MESSAGE_3]
    .filter(Boolean)
    .map((msg, i) => {
        const [label, ...rest] = msg.split('|||');
        return { label: label.trim(), template: rest.join('|||').trim(), actionId: 'welcome_msg_' + i };
    });

function titleCase(str) {
    str = str.toLowerCase();
    str = str.split(' ');

    for (let i = 0; i < str.length; i++) {
        str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
    }

    return str.join(' ');
}

(async () => {
    // Start the app
    await app.start(process.env.PORT || 3000);

    console.log('⚡️ Warm-welcome is running!');

    // team_join
    app.event('team_join', async ({ event, context }) => {
        try {
            // Retrieve the ID for the direct message to the new member
            let result = await app.client.conversations.open({
                token: context.botToken,
                users: engagementUserId
            });

            const imChannelId = result.channel.id;
            const message = event.user.real_name + ' joined Slack!';

            // Message the new member
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
                                value: event.user.id + ',' + event.user.real_name
                            })),
                            {
                                type: 'button',
                                text: {
                                    type: 'plain_text',
                                    text: 'Nope'
                                },
                                style: 'danger',
                                action_id: 'cancel',
                                value: event.user.real_name
                            }
                        ]
                    }
                ]
            });
        } catch (error) {
            console.error(error);
        }
    });

    // Listen to welcome message buttons
    messages.forEach(msg => {
        app.action(msg.actionId, async ({ action, ack, respond }) => {
            await ack();

            const newUser = action.value.split(',');

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
                    text: msg.template.replace('{{name}}', titleCase(newUser[1].split(' ')[0])),
                    as_user: 'yes',
                    unfurl_links: false,
                    unfurl_media: false
                });

                respond({
                    text: '*' + msg.label + '* message sent to *' + newUser[1] + '*',
                    replace_original: true
                });
            } catch (error) {
                console.error(error);
            }
        });
    });

    // Listen to cancelling
    app.action('cancel', async ({ action, ack, respond }) => {
        await ack();

        try {
            respond({
                text: 'Message *not* sent to ' + action.value,
                replace_original: true
            });
        } catch (error) {
            console.error(error);
        }
    });

    // Test
    app.message('fredisawesome', async ({ message, say }) => {
        say('Hello');
    });
})();
