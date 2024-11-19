import { Context, Markup } from 'telegraf';
import { WebSocketConfig } from '../types/WebSocketConfig';
import { CLIENTS } from '..';
import { generateId } from '../utils/generateId';

export async function listWebsockets(ctx: Context) {
  const userId = String(ctx.from!.id);
  const configs = CLIENTS.get(userId) || [];
  
  if (configs.length === 0) {
    await ctx.reply('У вас нет активных конфигураций');
    return;
  }

  const buttons = configs.map(config => [
    Markup.button.callback(
      `${config.isActive ? '🟢' : '🔴'} ${config.name} (${config.destination.type})`,
      `manage_${config.id}`
    )
  ]);

  await ctx.reply(
    'Ваши конфигурации:',
    Markup.inlineKeyboard([
      ...buttons,
      [Markup.button.callback('➕ Создать новую', 'create_websocket')]
    ])
  );
}

export async function manageWebsocket(ctx: Context, configId: string) {
  const userId = String(ctx.from!.id);
  const configs = CLIENTS.get(userId) || [];
  const config = configs.find(c => c.id === configId);

  if (!config) {
    await ctx.reply('Конфигурация не найдена');
    return;
  }

  await ctx.reply(
    `Управление конфигурацией "${config.name}":`,
    Markup.inlineKeyboard([
      [Markup.button.callback(
        config.isActive ? '🔴 Выключить' : '🟢 Включить', 
        `toggle_${configId}`
      )],
      [Markup.button.callback('✏️ Редактировать', `edit_${configId}`)],
      [Markup.button.callback('🗑 Удалить', `delete_${configId}`)],
      [Markup.button.callback('« Назад', 'list_websockets')]
    ])
  );
}
