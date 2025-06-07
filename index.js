const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const moment = require("moment-timezone");
const colors = require("colors");
const fs = require("fs");

const client = new Client({
  restartOnAuthFail: true,
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
  ffmpeg: "./ffmpeg.exe",
  authStrategy: new LocalAuth({ clientId: "client" }),
});
const config = require("./config/config.json");

client.on("qr", (qr) => {
  console.log(
    `[${moment().tz(config.timezone).format("HH:mm:ss")}] Scan the QR below : `
  );
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.clear();
  const consoleText = "./config/console.txt";
  fs.readFile(consoleText, "utf-8", (err, data) => {
    if (err) {
      console.log(
        `[${moment()
          .tz(config.timezone)
          .format("HH:mm:ss")}] Console Text not found!`.yellow
      );
      console.log(
        `[${moment().tz(config.timezone).format("HH:mm:ss")}] ${
          config.botname
        } is Ready!`.cyan
      );
    } else {
      console.log(data.cyan);
      console.log(
        `[${moment().tz(config.timezone).format("HH:mm:ss")}] ${
          config.botname
        } is Ready!`.cyan
      );
    }
  });
});

client.on("message", async (message) => {
  const isGroups = message.from.endsWith("@g.us") ? true : false;
  if ((isGroups && config.allowgroupchat) || !isGroups) {

    //Command list
    if (message.body == `${config.prefix}help`) {
      const commandList = `
╭─❏ *🤖 RexBot Command Menu*
│
│ 🎨 *${config.prefix}sticker*
│   ↳ _Convert image/video/gif to sticker_  
│   ↳ _Use with caption or reply_
│
│ 🖼️ *${config.prefix}image*
│   ↳ _Convert sticker to image_  
│   ↳ _Use by replying to a sticker_
│
│ 🧑‍🤝‍🧑 *${config.prefix}groupinfo*
│   ↳ _Show group details_
│
│ 🖼️ *${config.prefix}pp @user*
│   ↳ _Fetch profile picture of mentioned user_
│
╰────────────❏
`;

      if (config.log) console.log(`[${"!".red}] ${message.from.replace("@c.us", "").yellow} requesting a command list`);
      client.sendMessage(message.from, commandList);
    }


    if (message.body === `${config.prefix}groupinfo`) {
      if (!message.from.endsWith('@g.us')) {
          return client.sendMessage(message.from, '❌ This command can only be used in a group.');
      }

      const chat = await message.getChat();

      let groupInfo = `────── ⋆⋅ *📄 Group Info* ⋅⋆ ──────\n`;
      groupInfo += `🆔 *Name:* ${chat.name}\n`;
      groupInfo += `👥 *Participants:* ${chat.participants.length}\n`;
      groupInfo += `👑 *Owner:* ${chat.owner ? chat.owner.user : 'Unknown'}\n`;
      groupInfo += `🕒 *Created At:* ${moment(chat.createdAt).tz(config.timezone).format('dddd, MMMM D YYYY, HH:mm')}\n`;
      groupInfo += `📝 *Description:* ${chat.description || '-'}\n`;

      await client.sendMessage(message.from, groupInfo);
    }


    // Sticker Maker (with command)
    if (
      message.type == "image" ||
      message.type == "video" ||
      message.type == "gif" ||
      message._data.caption == `${config.prefix}sticker`
    ) {
      if (config.log) console.log(`[${"!".red}] ${message.from.replace("@c.us", "").yellow} requesting a sticker`);
      client.sendMessage(message.from, "*[⏳]* Converting...");
      try {
        const media = await message.downloadMedia();
        client
          .sendMessage(message.from, media, {
            sendMediaAsSticker: true,
            stickerName: config.botname, // Sticker Name = Edit in 'config/config.json'
            stickerAuthor: config.author, // Sticker Author = Edit in 'config/config.json'
          })
          .then(() => {
            client.sendMessage(message.from, "*[✅]* Sticker sent!");
          });
        if (config.log) console.log(`[${"!".red}] ${message.from.replace("@c.us", "").yellow} succesfully created a sticker`);
      } catch {
        client.sendMessage(
          message.from,
          "*[❎]* Failed to convert media to sticker!"
        );
        console.error(err);
      }

      //Sticker Maker(with reply)
    } else if (
      message.body === `${config.prefix}sticker` &&
      message.hasQuotedMsg
    ) {
      const quotedMsg = await message.getQuotedMessage();
      if (
        quotedMsg.hasMedia &&
        (quotedMsg.type === "image" || quotedMsg.type === "video")
      ) {
        if (config.log) console.log(`[${"!".red}] ${message.from.replace("@c.us", "").yellow} requesting a sticker`);

        client.sendMessage(message.from, "*[⏳]* Converting...");
        try {
          const media = await quotedMsg.downloadMedia();
          client
            .sendMessage(message.from, media, {
              sendMediaAsSticker: true,
              stickerName: config.botname,
              stickerAuthor: config.author,
            })
            .then(() => {
              client.sendMessage(message.from, "*[✅]* Sticker sent!");
            });
          if (config.log) console.log(`[${"!".red}] ${message.from.replace("@c.us", "").yellow} succesfully created a sticker`);
        } catch (err) {
          client.sendMessage(
            message.from,
            "*[❎]* Failed to convert media to sticker!"
          );
          console.error(err);
        }
      } else {
        client.sendMessage(
          message.from,
          "*[ℹ️]* Please reply to an image, gif, or short video!"
        );
      }

      //Sticker to image (with command)
    } else if (
      message.body === `${config.prefix}image` &&
      message.hasQuotedMsg
    ) {
      const quotedMsg = await message.getQuotedMessage();
      if (quotedMsg.hasMedia && quotedMsg.type === "sticker") {
        if (config.log) console.log(`[${"!".red}] ${message.from.replace("@c.us", "").yellow} requesting a sticker`);
        client.sendMessage(message.from, "*[⏳]* Converting...");
        try {
          const media = await quotedMsg.downloadMedia();
          client.sendMessage(message.from, media).then(() => {
            client.sendMessage(message.from, "*[✅]* Image sent!");
          });
          if (config.log)console.log(`[${"!".red}] ${message.from.replace("@c.us", "").yellow} succesfully converted sticker to image`);
        } catch (err) {
          client.sendMessage(
            message.from,
            "*[❎]* Failed to convert sticker to image!"
          );
          console.error(err);
        }
      } else {
        client.sendMessage(message.from, "*[ℹ️]* Please reply to a sticker!");
      }

      // Read chat
    } else {
      client.getChatById(message.id.remote).then(async (chat) => {
        await chat.sendSeen();
      });
    }
  }
});

client.initialize();
