import { EventEmitter } from 'events';
import WebSocketReconnect from '@javeoff/ws-reconnect';
import { parseObjectValues } from '../utils/parseObjectValues';

interface MessageHistory {
  id: string;
  timestamp: number;
}

interface Result {
	start: (id: string, query: Record<string, string | number>) => void;
	stop: (id: string) => void;
	listen: (id: string, onData: (data: any) => void) => void;
}

export function startWebsocketListening(): Result {
	const clients = new Map<string, WebSocketReconnect>();
	const eventEmitter = new EventEmitter();
	const messageHistories = new Map<string, MessageHistory[]>();
	const MESSAGE_TIMEOUT = 60 * 1000; // 1 minute in milliseconds

	const cleanupOldMessages = (wsId: string) => {
		const history = messageHistories.get(wsId);
		if (!history) return;
		
		const now = Date.now();
		const filtered = history.filter(msg => (now - msg.timestamp) < MESSAGE_TIMEOUT);
		messageHistories.set(wsId, filtered);
	};

	const start = (id: string, query: Record<string, string | number>) => {
		const ws = new WebSocketReconnect('wss://api.cryptoscan.pro/listen');
		clients.set(id, ws);

		ws.on('open', () => {
			try {
				ws.send(JSON.stringify(parseObjectValues(query)));
			} catch (e) {
				console.error(e);
			}
		});

		ws.on('message', (data: any) => {
			try {
				const parsedData = JSON.parse(String(data));
				if (parsedData.quota === 0) {
					console.error('Quota exceeded. Please try again later or buy subscription in https://cryptoscan.pro');
					return;
				}

				// Check if message has an id
				if (!parsedData.data.id) {
					console.error('Message has no id:', parsedData);
					return;
				}

				// Cleanup old messages
				cleanupOldMessages(id);

				// Get message history for this connection
				const history = messageHistories.get(id) || [];
				
				// Check if this message was recently received
				const isDuplicate = history.some(msg => msg.id === parsedData.data.id);
				
				if (!isDuplicate) {
					// Add new message to history
					history.push({
						id: parsedData.data.id,
						timestamp: Date.now()
					});
					messageHistories.set(id, history);
					
					// Only emit if not a duplicate
					eventEmitter.emit(id, parsedData);
				}
			} catch (e) {
				console.error('Error processing websocket message:', e);
			}
		});
	};

	const listen = (id: string, onData: (data: any) => void) => {
		eventEmitter.on(id, onData);
	};

	const stop = (id: string) => {
		console.log(`Stopping websocket for id: ${id}`);
		const ws = clients.get(id);
		if (ws) {
			console.log(`Found websocket connection for id: ${id}`);
			ws.removeAllListeners();
			ws.close(1000, 'Stopped by user');
			ws.destroy();
			clients.delete(id);
			console.log(`Websocket connection closed for id: ${id}`);
		} else {
			console.log(`No websocket connection found for id: ${id}`);
		}
		messageHistories.delete(id);
		eventEmitter.removeAllListeners(id);
		console.log(`Cleanup completed for id: ${id}`);
	};

	return {
		start,
		stop,
		listen,
	};
}
