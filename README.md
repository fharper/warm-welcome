# Slack Warm Welcome App

Semi-automated, welcome messages for new Slack community members. When someone joins, you get a DM with buttons to send one of your predefined welcome messages — so it looks personal, but takes one click and you can do it only when you are online.

## Why

When joining a community, there is nothing I find less welcoming than receiving a generic message from a bot (except for sharing the code of conduct & some guidelines) or even a lovely message from the community manager while they are clearly not online. Since communities are all about human connections, I firmly believe that it's really important to properly welcome people. To help me do this easily, I created this Slack application. I can now send some love to the new members, when I'm online and have time to discuss with them if they reply without being afraid of forgetting anyone.

## How It Works

1. A new member joins your Slack workspace.
2. You receive a DM mentioning their name and a button for each welcome message you configured.
3. You click a button when you're online and ready — the message is sent as a DM from you, not a bot.

## Setup

### 1. Create the Slack App

1. Go to [Your Apps](https://api.slack.com/apps) and click `Create an app` > `From an app manifest`.
2. Pick your workspace and click `Next`.
3. Update [manifest.yml](manifest.yml): replace `YOUR-APP-DOMAIN-GOES.HERE` with your app's domain in `redirect_urls`, `event_subscriptions > request_url`, and `interactivity > request_url`. Optionally change the app `name`, `description`, and `display_name`.
4. On step 2, click `YAML`, paste the content of [manifest.yml](manifest.yml), click `Next`, then `Create`.
5. Click `Install to Workspace`.

> If you later change the URL in the manifest, verify the event URL by running `./node_modules/.bin/slack-verify --secret SLACK_SIGNING_SECRET` with your actual signing secret.

### 2. Configure the .env File

Copy  [.env.example](.env.example) to [.env](.env) and fill the following:

| Variable | Where to find it |
| --- | --- |
| `SLACK_SIGNING_SECRET` | Settings > Basic Information > App Credentials > Signing Secret |
| `SLACK_BOT_TOKEN` | Features > OAuth & Permissions > Bot User OAuth Token |
| `YOUR_USER_TOKEN` | Features > OAuth & Permissions > User OAuth Token |
| `YOUR_USER_ID` | Click on your profile in Slack > three dots > Copy member ID |

#### Welcome Messages

Configure up to 3 messages using the format `Label|||message text`. Use `{{name}}` as a placeholder for the new member's first name:

```shell
MESSAGE="Welcome|||Welcome {{name}}! Happy to have you here."
MESSAGE_2="Employee|||Hey {{name}}! Be sure to read the internal guidelines."
MESSAGE_3="Casual|||What's up {{name}}!"
```

Each message gets its own button in the DM you receive.

### 3. Run the App

```shell
npm install
node index.js
```

Or with [pm2](https://github.com/Unitech/pm2) for persistence: `pm2 start index.js`

#### Docker

```shell
docker build -t warm-welcome .
docker run -p 80:8080 warm-welcome
```

### Testing

Join your Slack community as a new user. You should receive a DM with buttons for each configured message. Click one of the message button and the new member gets your welcome message. Check your server logs if something isn't working.
