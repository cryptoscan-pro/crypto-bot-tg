import { Context } from 'telegraf';

export interface BotContext extends Context {
  session: {
    awaitingConfigName: null | {
      query: Record<string, string>;
      destination: { type: 'private' | 'channel', id: string };
    };
    awaitingChannelId: null | {
      query: Record<string, string>;
    };
  };
}
