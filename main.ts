import TelegramBot, { Message } from "node-telegram-bot-api";
import { parse } from 'node-html-parser';
import fs from 'node:fs/promises';
import logger from "./logger";
import cron from 'node-cron';


const BOT_TOKEN = process.env.BOT_TOKEN;
const bot: TelegramBot = new TelegramBot(BOT_TOKEN, { polling: true });


const URL = "https://svtv.org/online/";
const CHAT_ID_FILENAME = "chat_id.txt";
const TIMEZONE = "Europe/Kiev";

let CHAT_ID: number = -1;
let NEWS = "";



main();



async function main() {
    logger.info("The program has started");

    try {
        const chatIdBuffer = await fs.readFile(CHAT_ID_FILENAME);
        const parsedId = Number(chatIdBuffer.toString());

        if (parsedId) {
            CHAT_ID = parsedId;
            logger.info("CHAT_ID was successfully parsed");
            logger.info("Trying to find yesterday news");
            await findNews();
        } else {
            logger.error("There is an incorrect CHAT_ID in the file!")
        }
    } catch (err) {
        if (err instanceof Error && 'code' in err) {
            if (err?.code === "ENOENT") {
                logger.warn(err, `${CHAT_ID_FILENAME} wasn't found`);
            }
        } else {
            logger.error("Unexpected error\n", err)
        }
    }
}

bot.on('message', async (msg: Message) => {
    logger.info(`@${msg.chat.username}: ${msg.text}`)
    if (msg.chat.username &&
        msg.chat.username === "herurgia" &&
        msg.text &&
        msg.text === "/start") {
        if (CHAT_ID !== -1) {
            bot.sendMessage(msg.chat.id, `CHAT_ID has been found (${CHAT_ID})`);
        } else {
            CHAT_ID = msg.chat.id;
            try {
                await fs.writeFile(CHAT_ID_FILENAME, CHAT_ID.toString());
                bot.sendMessage(msg.chat.id, `CHAT_ID has been written (${CHAT_ID})`);
            } catch {
                logger.error(`Some error happened. Can't write CHAT_ID into the file ${CHAT_ID_FILENAME}`)
                bot.sendMessage(msg.chat.id, `CHAT_ID has NOT been written (${CHAT_ID})`);
            }
            logger.info(`CHAT_ID has been written (${CHAT_ID})`);

        }
    }
});

async function findNews() {
    try {
        const response = await fetch(URL);
        const text = await response.text();
        const html = parse(text);

        const news = html.querySelectorAll("div.online__message-text");

        const date = new Date();
        date.setDate(date.getDate() - 1);

        const mainOfTheDay = news.filter(n => n.textContent.includes(`Что случилось ${date.getDate()}`))[0];

        if (!mainOfTheDay) return;

        const innerHTML = mainOfTheDay.innerHTML.replaceAll("<br>", "");

        const newsResponse: string[] = [`🗓️ <b>What happened on ${date.toLocaleString("en-us", { month: "long" })} ${date.getDate()}</b>`];

        innerHTML.split("\n").forEach((l, i) => {
            if (l.includes("🟡")) {
                newsResponse.push(l.replace("🟡", "🗞 "));
            }
        })

        NEWS = newsResponse.join("\n\n");
        logger.info("The news has found been and saved");
    } catch (err) {
        logger.error(err, "An error was found!");
    }
}

// Trying to get news every hour from 0am to 9am
cron.schedule('0 0-9 * * *', async () => {
    logger.info("CRON: Trying to find news");
    if (!NEWS) {
        await findNews();
    } else {
        logger.info("Finding news was skipped, because the previous one weren't be sent");
    }
}, {
    timezone: TIMEZONE
});


cron.schedule('30 22 * * *', async () => {
    logger.info("CRON: Trying to send the news");
    if (CHAT_ID !== -1) {
        if (NEWS) {
            bot.sendMessage(CHAT_ID, NEWS, {
                parse_mode: "HTML"
            });

            NEWS = "";
            logger.info("The news were sent");
        } else {
            bot.sendMessage(CHAT_ID, "❗️<b>An error happened</b>\n\nNo news were found!", {
                parse_mode: "HTML"
            });
            logger.info("No news were found");
        }
    } else {
        logger.error("No CHAT_ID was found!");
    }

}, {
    timezone: TIMEZONE
})
