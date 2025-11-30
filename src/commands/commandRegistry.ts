import { pingHandler } from "./ping";
import { echoHandler } from "./strings/echo";
import { setHandler } from "./strings/set";
import { getHandler } from "./strings/get";
import {
  blpopHandler,
  llenHandler,
  lpopHandler,
  lpushHandler,
  lrangeHandler,
  rpushHandler,
} from "./lists/list/list";
import { typeHandler } from "./strings/type";
import { type RESPReply } from "../utils/types";
import type { Socket } from "net";
import { xaddHandler, xrangeHandler, xreadHandler } from "./stream";

type CommandHandler = (commands: string[], connection: Socket) => RESPReply | void;

export const commandRegistry: Record<string, CommandHandler> = {
  ping: pingHandler,

  // String commands (operate on string values)
  echo: echoHandler,
  set: setHandler,
  get: getHandler,
  type: typeHandler,

  // List commands (operate on list values)
  rpush: rpushHandler,
  lrange: lrangeHandler,
  lpush: lpushHandler,
  llen: llenHandler,
  lpop: lpopHandler,
  blpop: blpopHandler,

  // Stream commands
  xadd: xaddHandler,
  xrange: xrangeHandler,
  xread: xreadHandler,
};
