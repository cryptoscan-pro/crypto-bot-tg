import { WebSocketConfig } from '../types/WebSocketConfig';
import { bot, telegramQueue } from './constants';
import { getMessageByItem } from './getMessageByItem';

export function createMessageHandler(config: WebSocketConfig) {
  return (data: any) => {
    telegramQueue.add(async () => {
      const message = getMessageByItem(data.data);
      if (config.destination.type === 'private') {
        bot.telegram.sendMessage(config.destination.id, message, {
          parse_mode: 'Markdown'
        });
      } else {
        bot.telegram.sendMessage(config.destination.id, message, {
          parse_mode: 'Markdown'
        });
      }
    });
  };
}