interface ChannelMessage {
    messageId: number;
    dataId: string;
    text: string;
}

export class MessageHistory {
    private history: Map<string, ChannelMessage[]> = new Map();
    private readonly maxHistory: number = 10;

    addMessage(channelId: string, messageId: number, dataId: string, text: string) {
        if (!this.history.has(channelId)) {
            this.history.set(channelId, []);
        }

        const channelHistory = this.history.get(channelId)!;
        channelHistory.push({ messageId, dataId, text });

        if (channelHistory.length > this.maxHistory) {
            channelHistory.shift();
        }
    }

    findMessage(channelId: string, dataId: string): ChannelMessage | undefined {
        return this.history.get(channelId)?.find(msg => msg.dataId === dataId);
    }
}
