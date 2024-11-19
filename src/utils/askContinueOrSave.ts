import { Markup } from "telegraf";
import { startNewStep } from "./startNewStep";
import { bot, telegramQueue } from "./constants";
import { CLIENTS } from "..";
import { getMessageByItem } from "./getMessageByItem";

export async function askContinueOrSave(
	ctx,
	userId: string,
	query: Record<string, string>,
	start: (id: string, query: Record<string, string>) => void,
	listen: (id: string, onData: (data: any) => void) => void
) {
	const continueButton = Markup.button.callback("Continue", "continue");
	const saveButton = Markup.button.callback("Save", "save");
	const keyboard = Markup.inlineKeyboard([[continueButton, saveButton]]);

	await ctx.reply("What would you like to do next?", keyboard);

	bot.action('continue', async (ctx) => {
		await ctx.answerCbQuery();
		await startNewStep(ctx);
	});

	bot.action('save', async (ctx) => {
		await ctx.answerCbQuery();
		CLIENTS.set(userId, query);
		start(userId, query as Record<string, string>);
		listen(userId, (data) => {
			telegramQueue.add(async () => {
				bot.telegram.sendMessage(userId, getMessageByItem(data));
			})
		})
		await ctx.reply("Settings saved!");
	});
}
