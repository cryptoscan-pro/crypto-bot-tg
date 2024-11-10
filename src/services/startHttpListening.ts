import PQueue from "p-queue";
import { QUEUE_CONCURRENCY, QUEUE_INTERVAL_CAP, QUEUE_INTERVAL, INTERVAL_TIME, SENT_IDS_LIMIT } from "../utils/constants";
import { getData } from "../utils/getData";
import { LimitedSet } from "../utils/LimitedSet";
import { EventEmitter } from 'events';

interface Result {
  start: (id: string, query: Record<string, string>) => void;
  stop: (id: string) => void;
  listen: (id: string, onData: (data: any) => void) => void;
}

export function startHttpListening(): Result {
  const sentIds = new LimitedSet<string>(SENT_IDS_LIMIT);
  const clients = new Map<string, NodeJS.Timeout>();

  const queue = new PQueue({
    concurrency: QUEUE_CONCURRENCY,
    intervalCap: QUEUE_INTERVAL_CAP,
    interval: QUEUE_INTERVAL,
  });

  const eventEmitter = new EventEmitter(); // Создаем экземпляр EventEmitter

  const stop = (id: string) => {
		clearInterval(clients.get(id));
    clients.delete(id);
  }

  const start = (id: string, query: Record<string, string>) => {
    const interval = setInterval(() => {
      queue.add(() => getData(query)).then((data) => {
        for (const { id: itemId, ...item } of data) {
          const isSavedId = sentIds.has(itemId);

          if (isSavedId) {
            continue;
          }

          sentIds.add(itemId);
          eventEmitter.emit(id, item); // Эмитим событие с данными
        }
      });
    }, INTERVAL_TIME);

    clients.set(id, interval);
  }

  const listen = (id: string, onData: (data: any) => void) => {
    eventEmitter.on(id, onData);
  }

  return {
    start,
    stop,
    listen,
  }
}

