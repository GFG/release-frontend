const { WebClient } = require("@slack/web-api");
const core = require("@actions/core");
const github = require("@actions/github");

function getIcon(status) {
  switch (status) {
    case "started":
      return ":hourglass:";
    case "finished":
      return ":git-approved:";
    case "failed":
      return ":red_circle:";
  }
}

function getBlocks(options) {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${getIcon(options.status)} ${
          options.alias
        } release <https://github.com/${options.repository}/releases/tag/${
          options.release.id
        }|${options.release.id}> is *${options.status.toUpperCase()}*:`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `<https://github.com/${options.repository}/commit/${options.commit.ref}|${options.commit.name}>`,
      },
      accessory: {
        type: "button",
        text: {
          type: "plain_text",
          text: "Go To GitHub",
          emoji: true,
        },
        value: "click_me_123",
        url: `https://github.com/${options.repository}/actions/runs/${options.action}`,
        action_id: "button-action",
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Release:*\n<https://github.com/${options.repository}/releases/tag/${options.release.id}|${options.release.id}>\n\n*Release Date:*\n${options.release.date}\n\n`,
      },
      accessory: {
        type: "image",
        image_url: "https://cdn-icons-png.flaticon.com/512/5084/5084071.png",
        alt_text: "computer thumbnail",
      },
    },
  ];
}

async function main() {
  try {
    const channel = core.getInput("channel-id");
    const token = core.getInput("bot-token");

    const client = new WebClient(token);

    const release = {
      action: github.context.runId,
      alias: core.getInput("alias"),
      commit: {
        ref: github.context.sha,
        name: github.context.sha, // fix later
      },
      release: {
        id: github.context.ref,
        date: new Date().toUTCString(),
      },
      repository: `${github.context.repo.owner}/${github.context.repo.name}`,
      status: core.getInput("status"),
    };

    const replaceTs = core.Input("replace-message-ts");

    const blocks = getBlocks(release);
    const text = `Hey ${release.alias}! Release ${release.release.id} is ${release.status}`;

    const result = replaceTs
      ? await client.chat.update({
          ts: replaceTs,
          text,
          blocks,
        })
      : await client.chat.postMessage({
          channel,
          blocks,
          text,
        });

    core.setOutput("ts", result.message.ts);
  } catch (err) {
    core.setFailed(err);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    core.setFailed(err);
    process.exit(1);
  });
