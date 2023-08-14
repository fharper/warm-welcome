# Slack Warm Welcome App

This application is helping anyone manage a Slack community semi-automate, in a less obvious, and more human way, welcome new members.

## Goal

It's a matter of personal opinion, but personally, there is nothing I find less welcoming than receiving a welcome message from a bot when I join a new community. There is also the clearly automated message, but coming from the community manager, founder or developer advocate, sent at like 3AM their time. It's a bit better than from a bot, but it's not there yet. Since communities are all about humans, but welcoming everyone manually is time consuming, even if I consider it to be super important for a healthy community.

I created this Slack application to help me welcome new members on my Slack community in a more human way while making it as easy and not time consuming at all. Here is how it works:

- When John Doe, a new member, join the community, Slack is firing an event that is sent to the application;
- The application send the person responsible for welcoming new users (configured in the [.env file](.env)), in that instance, me, a message saying that John Doe just joined the community;
- The message sent, contains a button to welcome John Doe directly;
- When I'm online, and I have time to answer any of their question, I then press the button, and a predefined welcome message (configured in the [.env file](.env)) is sent to John Doe, which include his full name;
- This process is repeated every time someone joins, so if two people joined while you were busy, once you're back on your Slack community, you'll see two messages with two buttons to press as you wish.

## Installation

### Node.js Application

First, you need to run the application on a cloud provider: you could run it locally but it needs to be accessible from the internet so Slack can send events to it. You will need to have [Node.js](https://nodejs.org), and [npm](https://www.npmjs.com) running on your cloud provider. Once you are ready to install the application, you can either clone this repository using the `git clone git@github.com:fharper/warm-welcome.git` command or you can just download the latest [release](https://github.com/fharper/warm-welcome/releases). Once the files are in place, run `npm install` to install all the dependencies. Be sure to update the following variable in the [.env file](.env)):

- **YOUR_USER_ID**: to get the user ID of the person who will send the welcome message, click on their name (either within a channel, or at the top of a direct message). On the left pane that opened, click on the three vertical dots, and choose `Copy member ID`. If it's yourself, click on your profile icon at the top right of Slack, and follow the same steps.
-**WELCOME_PART1** & **WELCOME_PART2**: the automated message is built with two parts, `WELCOME_PART1` being the text before the new user's full name, and `WELCOME_PART2` the text after.

_Future versions of this app will probably use templating, so this stupid implementation of `WELCOME_PART1` & `WELCOME_PART2` will be things of the past._

#### Run

Once it's done, you can run the application using the `node index.js` command. You would be advised to run it as a service to ensure it's always running, and restart when there is an issue (running it with something like [pm2](https://github.com/Unitech/pm2) `pm2 start index.js`). Note that the app won't work at first as you need to update the other variables from the [.env file](.env)), but you won't be able to do it before you create the Slack application.

#### Docker

You can also run the application using Docker

```shell
docker build -t warm-welcome .
docker run -p 80:8080 warm-welcome
```

### Slack Application

First, you need to create a new Slack application. To do so, connect to your Slack Workspace in the browser, and go to [Your Apps](https://api.slack.com/apps). Click on the `Create an app` button, and choose the second option named `From an app manifest`. On step 1 of 3 screens, pick the workspace you want to welcome people, and click `Next`.

Before the step 2, update the [manifest.yml](manifest.yml) file with the proper URL for your application. You need to update the `YOUR-APP-DOMAIN-GOES.HERE` part of the following members:

- `redirect_urls` from the `oauth_config` parent;
- `request_url` from the `settings > event_subscriptions` parent member;
- `request_url` from the `settings > interactivity` parent member.

Do not change the second part of the URL. Feel free to change the members `name` & `description` from the `display_information` parent to an application name and description that you prefer. You can also change the `display_name` member from the `bot_user > features` parent for a preferred bot name.

On the step 2 of 3 screen, click on `YAML`, overwrite the text with the content from the [manifest.yml](manifest.yml) file, and click `Next`. On the last screen, step 3 of 3, please validate that all the information is OK, and click the `Create` button. On the `Basic Information` screen, click on the "Install to Workspace" button. It will install the app to the workspace, and add the warm-welcome bot to it. Don't close this page yet, you'll need it for the next step.

> If at some point, you update the URL in the Slack application manifest, you'll be asked to verify the event URL. To do so, run `./node_modules/.bin/slack-verify --secret SLACK_SIGNING_SECRET` while replacing `SLACK_SIGNING_SECRET` with the `Signing Secret` value. Please read the next section to learn how to get that value.

### Node.js Application Configuration

Now that the Slack application is deployed, you need to update the configurations in the `.env` file from the information found on the page you kept open. Don't worry, it's the last step!

- **SLACK_SIGNING_SECRET**: from the `Settings` menu choose `Basic Information` (you should already be on that page). Under the `App Credentials` section, get the `Signing Secret` value;
- **YOUR_USER_TOKEN**: from the same page, under the `Building Apps for Slack` section, expend the `Add features and functionality` subsection, and click on `Permissions` which will bring you to the `OAuth & Permissions` page. On that page, under the `OAuth Tokens for Your Workspace` section, copy the value of `User OAuth Token`;
- **SLACK_BOT_TOKEN**: now copy the `Bot User OAuth Token` value.

Once you completed these steps, everything should be working. Congratulations!

### Testing

 If you want to test if everything is working, join your Slack community as a new user. At that point, the bot named `warm-welcome` (of the name you gave it in the [manifest.yml](manifest.yml) file) should send you a message in the form of `john-doe joined Slack! Welcome the new user now?` with a green `Now` button. If you press the button, John Doe will receive your message. If one of these steps isn't working, check the log from your web server as there's probably something wrong with the Node.js app. If the logs are fine, check if the app can be reachable from outside of your server, and validate the information on the Slack application page named `App Manifest` under the `Features` section.
