import { EventEmitter } from 'events';
import WebSocketReconnect from '@javeoff/ws-reconnect';
import { parseObjectValues } from '../utils/parseObjectValues';

interface Result {
	start: (id: string, query: Record<string, string | number>) => void;
	stop: (id: string) => void;
	listen: (id: string, onData: (data: any) => void) => void;
}

export function startWebsocketListening(): Result {
	const clients = new Map<string, WebSocketReconnect>();
	const eventEmitter = new EventEmitter();

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
				eventEmitter.emit(id, parsedData);
			} catch (e) {
				console.error('Error processing websocket message:', e);
			}
		});
	};

	const listen = (id: string, onData: (data: any) => void) => {
		eventEmitter.on(id, onData);
	};

	const stop = (id: string) => {
		const ws = clients.get(id);
		if (ws) {
			ws.close();
			clients.delete(id);
		}
		eventEmitter.removeAllListeners(id);
	};

	return {
		start,
		stop,
		listen,
	};
}
