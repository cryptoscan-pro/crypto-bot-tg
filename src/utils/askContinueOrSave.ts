import { Markup } from "telegraf";
import { bot, CLIENTS } from "./constants";
import { startNewStep } from "./startNewStep";

export async function askContinueOrSave(ctx, userId: string, query: Record<string, string>) {
    const continueButton = Markup.button.callback("Продолжить", "continue");
    const saveButton = Markup.button.callback("Сохранить", "save");
    const keyboard = Markup.inlineKeyboard([[continueButton, saveButton]]);

    await ctx.reply("Что хотите сделать дальше?", keyboard);

    bot.action('continue', async (ctx) => {
        await ctx.answerCbQuery();
        await startNewStep(ctx);
    });

    bot.action('save', async (ctx) => {
        await ctx.answerCbQuery();
        CLIENTS.set(userId, query);
        await ctx.reply("Настройки сохранены!");
        // Здесь можно завершить настройку
    });
}
