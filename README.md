# Slack Warm Welcome App
This application is helping anyone managing a community on Slack to properly and humanly welcome new members with not much efforts.

## Why
### The Problems
Personally, there is nothing I find less welcoming than receiving a message from a bot when I join a new community: community is all about the humans, even tech focussed ones. Actually, there is one thing I find less welcoming: the automated welcoming message or email that is supposedly sent from a real person. We all know it's automated, but to be honest, welcoming everyone is time consuming even if super important for a healthy community.

### The Solutions
It's why I created this application that helps me welcome new members of my Slack community in a more human way while making it as easy and not time consuming at all.
Here is how it works:
- When someone join the community, Slack is firing an event that is sent to my application;
- The application send me a message telling me John Doe just joined our community. This message contain a button to welcome that person directly;
- When I click the button, a welcoming message is sent to the person.

### The End Result
Nothing magic you say! The revolutionary idea (ahem) is that it's semi-automated. I only send the welcoming message when I'm online and have time to discuss with the new members if they replied (let's be honest, not everybody does unfortunately). By doing this, if they join at midnight my time, they don't received a message from someone offline. I don't have the stats, but I tested it when I was at DigitalOcean and it really helped to grow the interaction within the community and create more easily new relationships.

## What's next
So far, I'm happy with the simplicity of this small application, but I can see a future where I have multiple template messages, or messages sent depending of the language of the person (if I speak the same language of course). Maybe adding a multiple users possibilities so the first person online can personaly welcome the new members.

## How to use
You need to run the application on a cloud provider: you could run it locally but it needs to be accessible from the internet so Slack can send events to it.

### Configuration
First, you need to configure it. All configuration happens in the `.env` file.

**Creating the Slack App**
You need to [create a Slack App](https://api.slack.com/apps?new_app=1) in your workspace. Select the `From an app manifest` option, but first replace all the `YOUR_APP_URL` by the URL by which your application will be accessible.

You'll be asked to verify the event URL. On your server, run `./node_modules/.bin/slack-verify --secret <SLACK_SIGNING_SECRET>`. You can close this app when the verification is succesfull.

**SLACK_BOT_TOKEN**
You get this token once you install the app into your workspace. Check under `Features` >> `OAuth & Permissions` >> `OAuth Tokens for Your Workspace` and copy the `Bot User OAuth Token` value.

**SLACK_SIGNING_SECRET**
The secret is available under ` Settings` >> `Basic Information` >> `App Credentials` >> `Signing Secret`.

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

```
git clone git@github.com:fharper/warm-welcome.git
cd warm-welcome
npm install
node index.js
```
