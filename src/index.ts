import { Telegraf } from "telegraf";
import "dotenv/config";
import FileMap from "@javeoff/file-map";
import PQueue from "p-queue";
import {
  LISTENERS_FILE_PATH,
  SENT_IDS_LIMIT,
  QUEUE_CONCURRENCY,
  QUEUE_INTERVAL_CAP,
  QUEUE_INTERVAL,
  TELEGRAM_QUEUE_CONCURRENCY,
  TELEGRAM_QUEUE_INTERVAL_CAP,
  TELEGRAM_QUEUE_INTERVAL,
  INTERVAL_TIME,
  API_URL
} from "./utils/constants";
import { LimitedSet } from "./utils/LimitedSet";
import { getMessageByItem } from "./utils/getMessageByItem";
import { getData } from "./utils/getData";

const listeners = new FileMap(LISTENERS_FILE_PATH);
const sentIds = new LimitedSet<string>(SENT_IDS_LIMIT);
const queue = new PQueue({
	concurrency: QUEUE_CONCURRENCY,
	intervalCap: QUEUE_INTERVAL_CAP,
	interval: QUEUE_INTERVAL,
});
const telegramQueue = new PQueue({
	concurrency: TELEGRAM_QUEUE_CONCURRENCY,
	intervalCap: TELEGRAM_QUEUE_INTERVAL_CAP,
	interval: TELEGRAM_QUEUE_INTERVAL,
});

setInterval(() => {
	for (const [id, query] of Array.from(listeners.entries())) {
		queue.add(() => getData(query)).then((data) => {
			console.log('Data', data)
			for (const { id: itemId, ...item } of data) {
				const isSavedId = sentIds.has(itemId);

				if (isSavedId) {
					continue;
				}

				telegramQueue.add(() =>
					bot.telegram.sendMessage(id, getMessageByItem(item))
				)
				sentIds.add(itemId);
			}
		});
	}
}, INTERVAL_TIME);

const bot = new Telegraf(process.env.BOT_TOKEN!);

bot.command('add', async (ctx) => {
	const args = ctx.message.text.split(' ').slice(1);
	const query = {};

	for (const arg of args) {
		const [key, value] = arg.split('=')
		query[key] = value
	}

	listeners.set(String(ctx.from.id), query);

	ctx.reply('Listener added');
})

bot.launch();
