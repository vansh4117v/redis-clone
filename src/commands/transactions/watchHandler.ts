import type { Socket } from "net";
import { resp, type Transaction } from "../../utils/types";
import { memoryStore } from "../../store/memoryStore";

export const watchHandler = (commands: string[], connection: Socket) => {
  if (commands.length < 2) {
    return resp.error("ERR wrong number of arguments for 'watch' command");
  }
  const socketId = `${connection.remoteAddress}:${connection.remotePort}`;
  const keysToWatch = commands.slice(1);
  let transaction = memoryStore.getTransaction(socketId);

  if (!transaction) {
    const newTransaction: Transaction = {
      inMulti: false,
      queuedCommands: [],
      watchedKeys: new Map(),
      connection,
    };

    for (const key of keysToWatch) {
      const value = memoryStore.get(key);
      newTransaction.watchedKeys.set(key, value);
    }
    memoryStore.setTransaction(socketId, newTransaction);
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
