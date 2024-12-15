import PQueue from "p-queue";
import { QUEUE_CONCURRENCY, QUEUE_INTERVAL_CAP, QUEUE_INTERVAL, INTERVAL_TIME, SENT_IDS_LIMIT } from "../utils/constants";
import { getData } from "../utils/getData";
import { LimitedSet } from "../utils/LimitedSet";
import { EventEmitter } from 'events';
import { HttpResult } from "../types/HttpResult";

export function startHttpListening(): HttpResult {
  const sentIds = new LimitedSet<string>(SENT_IDS_LIMIT);
  const clients = new Map<string, NodeJS.Timeout>();

  const queue = new PQueue({
    concurrency: QUEUE_CONCURRENCY,
    intervalCap: QUEUE_INTERVAL_CAP,
    interval: QUEUE_INTERVAL,
  });

  const eventEmitter = new EventEmitter();

  const stop = (id: string) => {
		clearInterval(clients.get(id));
    clients.delete(id);
  }

  const start = (id: string, query: Record<string, string>) => {
    const interval = setInterval(() => {
      queue.add(() => getData(query)).then((data) => {
        // AI! change to await
        for (const { id: itemId, ...item } of data) {
          const isSavedId = sentIds.has(itemId);

          if (isSavedId) {
            continue;
          }

          sentIds.add(itemId);
          eventEmitter.emit(id, item);
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

