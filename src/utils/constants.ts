import PQueue from "p-queue";
import { Telegraf } from "telegraf";

export const CLIENTS_FILE_PATH = './clients.json';
export const SENT_IDS_LIMIT = 20;
export const QUEUE_CONCURRENCY = 10;
export const QUEUE_INTERVAL_CAP = 1;
export const QUEUE_INTERVAL = 50;
export const TELEGRAM_QUEUE_CONCURRENCY = 1;
export const TELEGRAM_QUEUE_INTERVAL_CAP = 1;
export const TELEGRAM_QUEUE_INTERVAL = 500;
export const INTERVAL_TIME = 5000;

export const API_URL = "https://api.cryptoscan.pro";

export const telegramQueue = new PQueue({
	concurrency: TELEGRAM_QUEUE_CONCURRENCY,
	intervalCap: TELEGRAM_QUEUE_INTERVAL_CAP,
	interval: TELEGRAM_QUEUE_INTERVAL,
});

export const bot = new Telegraf(process.env.BOT_TOKEN!);
