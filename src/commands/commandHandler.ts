import { type RESPReply, resp } from "../utils/types.js";
import { encodeRESP } from "../protocol/encodeRESP.js";
import { commandRegistry } from "./commandRegistry.js";
import type { Socket } from "net";
import { isInTransaction } from "../utils/isInTransaction.js";
import { transactionHandler } from "./transactions/transactionHandler.js";
import { transactionCommandsRegistry } from "./transactions/transactionRegistry.js";

export const commandHandler = (commandArray: string[], connection: Socket): void => {
  if (commandArray.length === 0) {
    connection.write(encodeRESP(resp.error("ERR unknown command")));
    return;
  }

  const command = commandArray[0].toLowerCase();
  let response: RESPReply | void;
  const socketId = `${connection.remoteAddress}:${connection.remotePort}`;
  if (isInTransaction(socketId)) {
    response = transactionHandler(commandArray, connection, socketId);
  } else if (command in transactionCommandsRegistry) {
    response = resp.error(`ERR ${command} without MULTI`);
  } else if (command in commandRegistry) {
    const handler = commandRegistry[command];
    response = handler(commandArray, connection);
  } else {
    response = resp.error(`ERR unknown command '${command}'`);
  }

  if (response) {
    connection.write(encodeRESP(response));
  }
};
