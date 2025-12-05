import { pingHandler } from "./ping.js";
import { echoHandler, setHandler, getHandler, typeHandler, incrHandler } from "./strings/index.js";
import {
  blpopHandler,
  llenHandler,
  lpopHandler,
  lpushHandler,
  lrangeHandler,
  rpushHandler,
} from "./lists/index.js";
import { type RESPReply } from "../utils/types.js";
import type { Socket } from "net";
import { xaddHandler, xrangeHandler, xreadHandler } from "./stream/index.js";
import { multiHandler } from "./transactions/multi.js";
import { watchHandler } from "./transactions/watchHandler.js";

export type CommandHandler = (commands: string[], connection: Socket) => RESPReply | void;

export const commandRegistry: Record<string, CommandHandler> = {
  ping: pingHandler,

  // String commands (operate on string values)
  echo: echoHandler,
  set: setHandler,
  get: getHandler,
  incr: incrHandler,
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

  // transaction
  multi: multiHandler,
  watch: watchHandler,
  // exec and discard are handled separately in commands/transactions/transactionHandler.ts
};
