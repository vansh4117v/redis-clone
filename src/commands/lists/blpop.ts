import type { Socket } from "net";
import { resp, type RESPArray, type RESPError, type BlockedClient } from "../../utils/types";
import { memoryStore } from "../../store/memoryStore";

export const blpopHandler = (commands: string[], socket: Socket): RESPArray | RESPError | void => {
  if (commands.length < 3) {
    return resp.error("ERR wrong number of arguments for 'BLPOP' command");
  }

  const keys = commands.slice(1, -1);
  const timeout = parseFloat(commands[commands.length - 1]);

  if (isNaN(timeout) || timeout < 0) {
    return resp.error("ERR timeout is not a float or out of range");
  }

  for (const key of keys) {
    const stored = memoryStore.get(key);
    if (stored) {
      if (stored.type !== "list") {
        return resp.error("WRONGTYPE Operation against a key holding the wrong kind of value");
      }
      if (stored.value.length > 0) {
        const value = stored.value.shift() as string;
        memoryStore.set(key, stored);
        return resp.array([resp.bulk(key), resp.bulk(value)]);
      }
    }
  }

  const deadline = timeout === 0 ? null : Date.now() + timeout * 1000;
  const blockedClient: BlockedClient = {
    id: socket.remoteAddress + ":" + socket.remotePort,
    socket: socket,
    keys: keys,
    deadline: deadline,
  };
  memoryStore.addBlockedClient(blockedClient);
};
