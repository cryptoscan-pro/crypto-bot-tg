import { Context } from 'telegraf';
import { WebSocketConfig } from '../types/WebSocketConfig';
import { CLIENTS } from '..';
import { generateId } from './generateId';
import { listWebsockets } from '../commands/websocket';

export async function saveWebsocketConfig(
  ctx: Context, 
  userId: string, 
  query: Record<string, string>, 
  name: string,
  destination: { type: 'private' | 'channel', id: string },
  start: (id: string, query: Record<string, string>) => void,
  listen: (id: string, onData: (data: any) => void) => void,
  createMessageHandler: (config: WebSocketConfig) => (data: any) => void
) {
  const config: WebSocketConfig = {
    id: generateId(),
    query,
    destination,
    isActive: true,
    name
  };
  
  const configs = CLIENTS.get(userId) || [];
  configs.push(config);
  CLIENTS.set(userId, configs);
  
  start(config.id, config.query);
  listen(config.id, createMessageHandler(config));
  
  await ctx.reply('Конфигурация сохранена!');
  await listWebsockets(ctx);
}
