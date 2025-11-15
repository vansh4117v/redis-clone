import { type RESPReply, resp } from "../utils/types";
import { encodeRESP } from "../protocol/encodeRESP";
import { commandRegistry } from "./commandRegistry";
import type { Socket } from "net";

export const commandHandler = (commandArray: string[], connection: Socket): void => {
  if (commandArray.length === 0) {
    connection.write(encodeRESP(resp.error("ERR unknown command")));
    return;
  }

  const command = commandArray[0].toLowerCase();
  let response: RESPReply | void;
  if (command in commandRegistry) {
    const handler = commandRegistry[command];
    response = handler(commandArray, connection);
  } else {
    response = resp.error(`ERR unknown command '${command}'`);
  }

  if (response) {
    connection.write(encodeRESP(response));
  }
};
