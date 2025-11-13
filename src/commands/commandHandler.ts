import { pingHandler } from "./ping";
import { echoHandler } from "./echo";
import { setHandler } from "./set";
import { getHandler } from "./get";
import {
  blpopHandler,
  llenHandler,
  lpopHandler,
  lpushHandler,
  lrangeHandler,
  rpushHandler,
} from "./list";
import { type RESPReply, resp } from "../utils/types";
import type { Socket } from "net";
import { encodeRESP } from "../protocol/encodeRESP";

type CommandHandler = (commands: string[], connection: Socket) => RESPReply | void;

const commandHandlerMapping: Record<string, CommandHandler> = {
  ping: pingHandler,
  echo: echoHandler,
  set: setHandler,
  get: getHandler,
  rpush: rpushHandler,
  lrange: lrangeHandler,
  lpush: lpushHandler,
  llen: llenHandler,
  lpop: lpopHandler,
  blpop: blpopHandler,
};


export const commandHandler = (commandArray: string[], connection: Socket): void => {
  const command = commandArray[0].toLowerCase();
  let response: RESPReply | void;
  if (command in commandHandlerMapping) {
    const handler = commandHandlerMapping[command];
    response = handler(commandArray, connection);
  } else {
    response = resp.error(`ERR unknown command '${command}'`);
  }
  if (response) {
    connection.write(encodeRESP(response));
  }
};
