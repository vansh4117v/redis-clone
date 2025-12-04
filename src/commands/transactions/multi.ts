import type { Socket } from "net";
import { resp, type RESPError, type RESPStatus, Transaction } from "../../utils/types";
import { memoryStore } from "../../store/memoryStore";

export const multiHandler = (commands: string[], connection: Socket): RESPError | RESPStatus => {
  if (commands.length !== 1) {
    return resp.error("ERR wrong number of arguments for 'multi' command");
  }
  const socketId = `${connection.remoteAddress}:${connection.remotePort}`;
  const transaction = memoryStore.getTransaction(socketId);

  if (!transaction) {
    const newTransaction: Transaction = {
      inMulti: true,
      queuedCommands: [],
      watchedKeys: new Map(),
      connection,
    };
    memoryStore.setTransaction(socketId, newTransaction);
    return resp.status("OK");
  }
  else if (transaction.inMulti) {
    return resp.error("ERR MULTI calls can not be nested");
  }
  
  transaction.inMulti = true;
  transaction.queuedCommands = [];
  return resp.status("OK");
}