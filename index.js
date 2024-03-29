const dotenv = require('dotenv');
const { App } = require('@slack/bolt');

dotenv.config();

const app = new App({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    token: process.env.SLACK_BOT_TOKEN
});
const engagementUserId = process.env.YOUR_USER_ID;
const engagementUserToken = process.env.YOUR_USER_TOKEN;
const welcomeMessagePart1 = process.env.WELCOME_PART1;
const welcomeMessagePart2 = process.env.WELCOME_PART2;

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
                            {
                                type: 'button',
                                text: {
                                    type: 'plain_text',
                                    text: 'Now'
                                },
                                style: 'primary',
                                action_id: 'welcome_new_user',
                                value: event.user.id + ',' + event.user.real_name
                            },
                            {
                                type: 'button',
                                text: {
                                    type: 'plain_text',
                                    text: 'Nope'
                                },
                                style: 'primary',
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

    // Listen to welcome_new_user
    app.action('welcome_new_user', async ({ action, ack, respond }) => {

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
                text: welcomeMessagePart1 + titleCase(newUser[1].split(' ')[0]) + welcomeMessagePart2,
                as_user: 'yes'
            });

            respond({
                text: 'Message sent to *' + newUser[1] + '*',
                replace_original: true
            });
        } catch (error) {
            console.error(error);
        }
    });

    // Listen to cancelling
    app.action('cancel', async ({ action, ack, respond }) => {

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
