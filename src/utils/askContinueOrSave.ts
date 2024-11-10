import { Markup } from "telegraf";
import { startNewStep } from "./startNewStep";
import { bot } from "./constants";
import { CLIENTS } from "..";

export async function askContinueOrSave(ctx, userId: string, query: Record<string, string>) {
    const continueButton = Markup.button.callback("Продолжить", "continue");
    const saveButton = Markup.button.callback("Сохранить", "save");
    const keyboard = Markup.inlineKeyboard([[continueButton, saveButton]]);

    await ctx.reply("What would you like to do next?", keyboard);

    bot.action('continue', async (ctx) => {
        await ctx.answerCbQuery();
        await startNewStep(ctx);
    });

    bot.action('save', async (ctx) => {
        await ctx.answerCbQuery();
        CLIENTS.set(userId, query);
        await ctx.reply("Settings saved!");
    });
}
