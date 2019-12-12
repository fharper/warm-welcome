/*const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => res.send('Hello World!'))

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
*/

const dotenv = require('dotenv');
const { App } = require('@slack/bolt');

dotenv.config();

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
});

/* Add functionality here */

(async () => {
  // Start the app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');


  // This will match any message that contains 👋
  app.message('fredisawesome', async ({ message, say}) => {
    say(`Hello, <@${message.user}>`);
  });

})();