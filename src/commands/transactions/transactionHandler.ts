import { type RedisConnection, resp, type RESPReply, Transaction } from "../../utils/types.js";
import { commandRegistry } from "../commandRegistry.js";
import { transactionCommandsRegistry } from "./transactionRegistry.js";

export const transactionHandler = (commands: string[], connection: RedisConnection): RESPReply => {
  if (commands.length === 0) {
    return resp.error("ERR unknown command");
  }

  const command = commands[0].toLowerCase();

  if (command in transactionCommandsRegistry) {
    const handler = transactionCommandsRegistry[command];
    return handler(commands, connection);
  } else {
    if (command in commandRegistry) {
      if (command === "watch" || command === "multi") {
        return resp.error(`ERR ${command} inside MULTI is not allowed`);
      }

      // transaction is guaranteed to exist here as checked in commandHandler
      const transaction = connection.transaction as Transaction;
      transaction.queuedCommands.push(commands);
      return resp.status("QUEUED");
    } else {
      return resp.error(`ERR unknown command '${command}'`);
    }
  }
};
