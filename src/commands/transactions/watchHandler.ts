import { type RedisConnection, resp, type Transaction } from "../../utils/types.js";
import { memoryStore } from "../../store/memoryStore.js";

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

    for (const key of keysToWatch) {
      const value = memoryStore.get(key);
      newTransaction.watchedKeys.set(key, value);
    }
    connection.transaction = newTransaction;
  } else {
    if (transaction.inMulti) {
      return resp.error("ERR WATCH inside MULTI is not allowed");
    }
    for (const key of keysToWatch) {
      // Re-watching a key updates its watched value to the current value
      const value = memoryStore.get(key);
      transaction.watchedKeys.set(key, value);
    }
  }
  return resp.status("OK");
};
