import { config } from 'dotenv';

/**
 * Load config
 */
config();
/**
 * @type {Object.<string,string | undefined>}
 */
const envConfig = {
  ltokenV2: process.env.ltoken_v2,
  ltuidV2: process.env.ltuid_v2,
  discordId: process.env.discord_id,
  discordWebhook: process.env.discord_webhook,
};
/** This code is based on canaria3406 and modified by Areha11Fz **/
/** The following is the script code. Please DO NOT modify. **/
const urlDict = {
  ZZZ: 'https://sg-act-nap-api.hoyolab.com/event/luna/zzz/os/sign?lang=en-us&act_id=e202406031448091',
  Genshin:
    'https://sg-hk4e-api.hoyolab.com/event/sol/sign?lang=en-us&act_id=e202102251931481',
  Star_Rail:
    'https://sg-public-api.hoyolab.com/event/luna/os/sign?lang=en-us&act_id=e202303301540311',
  Honkai_3:
    'https://sg-public-api.hoyolab.com/event/mani/sign?lang=en-us&act_id=e202110291205111',
};

/**
 * Auto sign-in
 */
const profiles = {
  token: `ltoken_v2=${envConfig.ltokenV2}; ltuid_v2=${envConfig.ltuidV2};`,
  zzz: true,
  genshin: true,
  honkai_star_rail: false,
  honkai_3: false,
  accountName: 'heatsh',
};
const messages = await autoSignFunction(profiles);

/** Discord Notification **/
postWebhook(envConfig.discord_webhook, messages);

function discordPing() {
  return envConfig.discord_id ? `<@${envConfig.discord_id}> ` : '';
}

async function autoSignFunction({
  token,
  zzz,
  genshin,
  honkai_star_rail,
  honkai_3,
  accountName,
}) {
  const urls = [];

  if (zzz) urls.push(urlDict.ZZZ);
  if (genshin) urls.push(urlDict.Genshin);
  if (honkai_star_rail) urls.push(urlDict.Star_Rail);
  if (honkai_3) urls.push(urlDict.Honkai_3);

  let response = `${accountName}`;

  const httpResponses = await Promise.all(
    urls.map((url) =>
      fetch(url, {
        method: 'POST',
        headers: {
          Cookie: token,
          Accept: 'application/json, text/plain, */*',
          'Accept-Encoding': 'gzip, deflate, br',
          Referer: 'https://act.hoyolab.com/',
          Origin: 'https://act.hoyolab.com',
        },
      })
    )
  );

  for (const [i, hoyolabResponse] of httpResponses.entries()) {
    const gameName = Object.keys(urlDict)
      .find((key) => urlDict[key] === urls[i])
      ?.replace(/_/g, ' ');
    const isError = hoyolabResponse.status !== 200;
    const bannedCheck = (await hoyolabResponse.json()).data?.gt_result?.is_risk;

    if (bannedCheck) {
      response += `\n${gameName}: ${discordPing()} Auto check-in failed due to CAPTCHA blocking.`;
      break;
    } else {
      response += `\n${gameName}: ${isError ? discordPing() : ''}${
        hoyolabResponse.status
      }`;
    }
  }

  return response;
}

/**
 * @param {string | undefined} discordWebhook
 * @param {string | undefined} message
 */
function postWebhook(discordWebhook, message) {
  if (!discordWebhook || !message) {
    return;
  }
  let payload = JSON.stringify({
    username: 'Auto Check-In Notification',
    avatar_url: 'https://i.imgur.com/ibrSmCn.png',
    content: message,
  });

  fetch(discordWebhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  });
}
