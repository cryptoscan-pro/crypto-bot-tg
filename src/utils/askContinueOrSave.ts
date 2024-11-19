import { Markup } from "telegraf";
import { startNewStep } from "./startNewStep";
import { bot, telegramQueue } from "./constants";
import { CLIENTS } from "..";
import { getMessageByItem } from "./getMessageByItem";
import { BotContext } from "../types/BotContext";
import { generateId } from "./generateId";
import { WebSocketConfig } from "../types/WebSocketConfig";

export async function askContinueOrSave(
  ctx: BotContext,
  userId: string,
  query: Record<string, string>
) {
  // Remove any existing handlers first
  bot.removeAllListeners('text');
  await ctx.reply(
    'Что делаем дальше?',
    Markup.inlineKeyboard([
      [
        Markup.button.callback('Продолжить настройку', 'continue'),
        Markup.button.callback('Сохранить конфигурацию', 'save')
      ],
      [Markup.button.callback('« Назад', 'back_to_start')]
    ])
  );

  bot.action('continue', async (ctx) => {
    await ctx.answerCbQuery();
    await startNewStep(ctx);
  });

  bot.action('save', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('Введите название для этой конфигурации:');
    
    if (!ctx.session) ctx.session = {};
    ctx.session.awaitingConfigName = {
      query,
      destination: { type: 'private' as const, id: userId }
    };
  });
}
