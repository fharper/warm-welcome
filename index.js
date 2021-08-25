const dotenv = require('dotenv');
const { App } = require('@slack/bolt');

dotenv.config();

const app = new App({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    token: process.env.SLACK_BOT_TOKEN
});
const engagementUserId = process.env.YOUR_USER_ID;
const engagementUserToken = process.env.YOUR_USER_TOKEN;
const welcomeMessagePart1 = process.env.WELCOME_PART1
const welcomeMessagePart2 = process.env.WELCOME_PART2;

(async () => {
  // Start the app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Warm-welcome is running!');

  //team_join
  app.event('team_join', async ({ event, context }) => {

      try {
        //Retrieve the ID for the direct message to the new member
        let result = await app.client.im.open({
          token: context.botToken,
          user: engagementUserId
        });

        let imChannelId = result.channel.id;
        let message = event.user.real_name + ' joined Slack!';

        //Message the new member
        result = await app.client.chat.postMessage({
          token: context.botToken,
          channel: imChannelId,
          text: message,
            "blocks": [
              {
                "type": "section",
                "text": {
                  "type": "mrkdwn",
                  "text": message + " Welcome the new user now?"
                }
              },
              {
                "type": "actions",
                "block_id": "welcomeFolks",
                "elements": [
                  {
                    "type": "button",
                    "text": {
                      "type": "plain_text",
                      "text": "Now"
                    },
                    "style": "primary",
                    "action_id": "welcome_new_user",
                    "value": event.user.id + "," + event.user.real_name
                  }
                ]
              }
            ]
        });

      }
      catch (error) {
        console.error(error);
      }
  });

  //Listen to welcome_new_user
  app.action('welcome_new_user', async ({ action, ack, respond }) => {
    //ack();

    let newUser = action.value.split(",");

    try {
        //Retrieve the ID for the direct message to the new member
        let result = await app.client.im.open({
          token: engagementUserToken,
          user: newUser[0]
        });
        let imChannelId = result.channel.id;

      //Send the welcome message
      result = await app.client.chat.postMessage({
        token: engagementUserToken,
        channel: imChannelId,
        text: welcomeMessagePart1 + newUser[1].split(" ")[0] + welcomeMessagePart2,
        as_user: 'yes'
      });

      respond({
        text: 'Message sent',
        replace_original: true
      });

    }
    catch (error) {
      console.error(error);
    }
  });

  //Test
  app.message('fredisawesome', async ({ message, say}) => {
    say('Hello');
  });

})();