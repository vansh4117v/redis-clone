import {
  type RedisConnection,
  resp,
  type RESPError,
  type RESPStatus,
  type Transaction,
} from "../../utils/types.js";

export const multiHandler = (
  commands: string[],
  connection: RedisConnection
): RESPError | RESPStatus => {
  if (commands.length !== 1) {
    return resp.error("ERR wrong number of arguments for 'multi' command");
  }
  const transaction = connection.transaction;

  if (!transaction) {
    const newTransaction: Transaction = {
      inMulti: true,
      queuedCommands: [],
      watchedKeys: new Map(),
    };
    connection.transaction = newTransaction;
    return resp.status("OK");
  } else if (transaction.inMulti) {
    return resp.error("ERR MULTI calls can not be nested");
  }

  transaction.inMulti = true;
  transaction.queuedCommands = [];
  return resp.status("OK");
};
