import {
  type RedisConnection,
  type RedisStoredValue,
  resp,
  type Transaction,
} from "../../utils/types.js";
import { memoryStore } from "../../store/memoryStore.js";

const snapshotValue = (value: RedisStoredValue | undefined): RedisStoredValue | undefined =>
  value === undefined ? undefined : { ...value };

const setWatchedKeys = (watchedKeys: Map<string, RedisStoredValue | undefined>, keys: string[]) => {
  for (const key of keys) {
    watchedKeys.set(key, snapshotValue(memoryStore.get(key)));
  }
};

export const watchHandler = (commands: string[], connection: RedisConnection) => {
  if (commands.length < 2) {
    return resp.error("ERR wrong number of arguments for 'watch' command");
  }
  const keysToWatch = commands.slice(1);
  const transaction = connection.transaction;

  if (!transaction) {
    const newTransaction: Transaction = {
      inMulti: false,
      queuedCommands: [],
      watchedKeys: new Map(),
    };

    setWatchedKeys(newTransaction.watchedKeys, keysToWatch);
    connection.transaction = newTransaction;
    return resp.status("OK");
  }

  if (transaction.inMulti) {
    return resp.error("ERR WATCH inside MULTI is not allowed");
  }

  setWatchedKeys(transaction.watchedKeys, keysToWatch);
  return resp.status("OK");
};
