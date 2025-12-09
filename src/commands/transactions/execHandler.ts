import { type RedisConnection, resp, type RESPReply, type Transaction } from "../../utils/types.js";
import { isEqual } from "../../utils/isEqual.js";
import { memoryStore } from "../../store/memoryStore.js";
import { commandRegistry } from "../commandRegistry.js";

export const execHandler = (commands: string[], connection: RedisConnection) => {
  if (commands.length !== 1) {
    return resp.error("ERR wrong number of arguments for 'exec' command");
  }
  const responses: RESPReply[] = [];

  // transaction is guaranteed to exist here as checked in commandHandler
  const transaction = connection.transaction as Transaction;

  for (const [key, originalValue] of transaction.watchedKeys) {
    const currentValue = memoryStore.get(key);
    // Deep comparison for watched values using isEqual utility
    if (!isEqual(currentValue, originalValue)) {
      connection.transaction = undefined;
      return resp.bulk(null);
    }
  }

  for (const queuedCommand of transaction.queuedCommands) {
    const commandName = queuedCommand[0].toLowerCase();
    const commandHandler = commandRegistry[commandName];
    if (commandHandler) {
      const response = commandHandler(queuedCommand, connection);
      // response can not be void here as all command handlers return RESPReply when not called in a transaction
      responses.push(response as RESPReply);
    }
  }
  connection.transaction = undefined;
  return resp.array(responses);
};
