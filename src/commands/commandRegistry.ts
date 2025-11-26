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
import { typeHandler } from "./type";
import { type RESPReply } from "../utils/types";
import type { Socket } from "net";
import { xaddHandler, xrangeHandler } from "./stream";

type CommandHandler = (commands: string[], connection: Socket) => RESPReply | void;

export const commandRegistry: Record<string, CommandHandler> = {
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
  type: typeHandler,
  xadd: xaddHandler,
  xrange: xrangeHandler,
};
