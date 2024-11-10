import { EventEmitter } from 'events';
import WebSocketReconnect from '@javeoff/ws-reconnect';
import { CLIENTS_FILE_PATH } from "../utils/constants";
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
				eventEmitter.emit(id, JSON.parse(String(data)));
			} catch (e) {
				console.error(e);
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
