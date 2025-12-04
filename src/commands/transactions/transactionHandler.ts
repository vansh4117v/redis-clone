import type { Socket } from "net";
import { resp, type RESPReply } from "../../utils/types";
import { commandRegistry } from "../commandRegistry";
import { memoryStore } from "../../store/memoryStore";
import { transactionCommandsRegistry } from "./transactionRegistry";

export const transactionHandler = (
  commands: string[],
  connection: Socket,
  socketId: string
): RESPReply => {
  if (commands.length === 0) {
    return resp.error("ERR unknown command");
  }

  const command = commands[0].toLowerCase();

  if (command in transactionCommandsRegistry) {
    const handler = transactionCommandsRegistry[command];
    return handler(commands, connection, socketId);
  } else {
    if (command in commandRegistry) {
      if (command === "watch" || command === "multi") {
        return resp.error(`ERR ${command} inside MULTI is not allowed`);
      }
      
      const transaction = memoryStore.getTransaction(socketId);
      transaction?.queuedCommands.push(commands);
      return resp.status("QUEUED");
    } else {
      return resp.error(`ERR unknown command '${command}'`);
    }
  }
};
