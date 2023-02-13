# Slack Warm Welcome App

This application is helping anyone manage a Slack community semi-automate, in a less obvious, and more human way, welcome new members.

## Goal

It's a matter of personal opinion, but personally, there is nothing I find less welcoming than receiving a welcome message from a bot when I join a new community. There is also the clearly automated message, but coming from the community manager, founder or developer advocate, sent at like 3AM their time. It's a bit better than from a bot, but it's not there yet. Since communities are all about humans, but welcoming everyone manually is time consuming, even if I consider it to be super important for a healthy community.

I created this Slack application to help me welcome new members on my Slack community in a more human way while making it as easy and not time consuming at all. Here is how it works

- When John Doe, a new member, join the community, Slack is firing an event that is sent to the application;
- The application send the person responsible for welcoming new users (configured in the [.env file](.env)), in that instance, me, a message saying that John Doe just joined the community;
- The message sent, contains a button to welcome John Doe directly;
- When I'm online, and I have time to answer any of their question, I then press the button, and a predefined welcome message (configured in the [.env file](.env)) is sent to John Doe, which include his full name;
- This process is repeated every time someone joins, so if two people joined while you were busy, once you're back on your Slack community, you'll see two messages with two buttons to press as you wish.

## Installation

You need to run the application on a cloud provider: you could run it locally but it needs to be accessible from the internet so Slack can send events to it.

### Configuration

First, you need to configure it. All configuration happens in the `.env` file.

#### Install the Node.js application

**Creating the Slack App**
You need to [create a Slack App](https://api.slack.com/apps?new_app=1) in your workspace. Select the `From an app manifest` option, but first replace all the `YOUR_APP_URL` by the URL by which your application will be accessible.

You'll be asked to verify the event URL. On your server, run `./node_modules/.bin/slack-verify --secret <SLACK_SIGNING_SECRET>`. You can close this app when the verification is succesfull.

**SLACK_BOT_TOKEN**
You get this token once you install the app into your workspace. Check under `Features` >> `OAuth & Permissions` >> `OAuth Tokens for Your Workspace` and copy the `Bot User OAuth Token` value.

**SLACK_SIGNING_SECRET**
The secret is available under `Settings` >> `Basic Information` >> `App Credentials` >> `Signing Secret`.

**YOUR_USER_ID**
The user ID of the person who will automagically send the welcome messages. You can find it in your Slack profile, by using `Copy member ID` under the `More` menu.

**YOUR_USER_TOKEN**
You get this token once you install the app into your workspace and allow `chat.message` permission. Check under `Features` >> `OAuth & Permissions` >> `OAuth Tokens for Your Workspace` and copy the `User OAuth Token` value.

**WELCOME_PART1**
I was lazy when I built this little app, so this is the first part of the message before the new member name (i.e.: "Welcome ").

**WELCOME_PART2**
This is the part after the new member name (i.e.: ", I'm Fred the Director of Developer Relations at..."). So when the user received the message, it will be like WELCOME_PART1 + `automatically detected new member real name` +  WELCOME_PART2 (i.e.: "Welcome John Doe, I'm Fred the Director of Developer Relations at..."). I really need to fix that...

### On the server

You only need Node.js & npm installed. You better start it as service so it works all the time, and will restart in case of problem or reboot.

```shell
git clone git@github.com:fharper/warm-welcome.git
cd warm-welcome
npm install
node index.js
```
