import { WebSocketConfig } from '../types/WebSocketConfig';
import { bot, telegramQueue } from './constants';
import { getMessageByItem } from './getMessageByItem';
import path from 'path';

export function createMessageHandler(config: WebSocketConfig) {
  return async (data: any) => {
    let message = getMessageByItem(data.data);

    // Apply template if specified
    if (config.templatePath) {
      try {
        const templateModule = require(path.resolve(process.cwd(), config.templatePath));
        if (typeof templateModule.formatMessage === 'function') {
          message = await templateModule.formatMessage(data.data, message);
        }
      } catch (error) {
        console.error('[Template] Error processing message:', error);
      }
    }

    // Apply AI formatting if specified
    if (config.aiPrompt) {
      try {
        message = await formatWithGPT(message, config.aiPrompt);
      } catch (error) {
        console.error('[AI] Error processing message:', error);
      }
    }

    // Add suffix if specified
    if (config.suffix && config.suffix !== '-') {
      message = `${message}\n\n${config.suffix}`;
    }

    await telegramQueue.add(async () => {
      try {
        await bot.telegram.sendMessage(config.destination.id, clearMessage(message), {
          parse_mode: 'Markdown',
          disable_web_page_preview: true
        });
      } catch (error) {
        console.error('[Telegram] Error sending message:', error);
      }
    });
  };
}
