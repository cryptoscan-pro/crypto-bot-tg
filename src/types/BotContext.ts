import { Context } from 'telegraf';

export interface BotContext extends Context {
  session?: {
    editingConfig?: {
      configId: string;
      query: Record<string, string>;
      destination: { type: 'private' | 'channel', id: string };
      name: string;
      templatePath?: string;
    };
    awaitingConfigName?: {
      query: Record<string, string>;
      destination: { type: 'private' | 'channel', id: string };
    };
    awaitingChannelId?: {
      query: Record<string, string>;
    };
  };
}
