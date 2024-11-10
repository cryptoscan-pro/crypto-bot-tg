import { Telegraf } from "telegraf";
import "dotenv/config";
import FileMap from "@javeoff/file-map";
import PQueue from "p-queue";
import { LimitedSet } from "./utils/LimitedSet";

const listeners = new FileMap('./listeners.json');
const sentIds = new LimitedSet<string>(20);
const queue = new PQueue({
	concurrency: 10,
	intervalCap: 1,
	interval: 50,
})
const telegramQueue = new PQueue({
	concurrency: 1,
	intervalCap: 1,
	interval: 100,
})

function getMessageByItem(item: Record<string, string | number>) {
	return Object.entries(item)
		.map(([key, value]) => {
			if (!value) {
				return;
			}

			return `${key}: ${value}`
		})
		.filter((v) => !!v)
		.join('\n');
}

export async function getData(query: Record<string, string>) {
	console.log(query)
	return fetch("https://api.cryptoscan.pro?" + new URLSearchParams(query))
		.then(async (res) => {
			if (!res.ok) {
				throw new Error(await res.text());
			}

			return res;
		})
		.then((res) => res.json())
		.then((res) => res.data)
}

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
}, 5000)

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
