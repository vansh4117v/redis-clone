import {
  resp,
  type RESPArray,
  type RESPError,
  type BlockedClient,
  type RedisConnection,
} from "../../utils/types.js";
import { memoryStore } from "../../store/memoryStore.js";

export const blpopHandler = (
  commands: string[],
  socket: RedisConnection
): RESPArray | RESPError | void => {
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

  if (socket.transaction && socket.transaction.inMulti) {
    // In a transaction, BLPOP should not block, return null if no data
    return resp.array(null);
  }

  const deadline = timeout === 0 ? null : Date.now() + timeout * 1000;
  const blockedClient: BlockedClient = {
    id: socket.clientInfo.addr,
    socket: socket,
    keys: keys,
    deadline: deadline,
  };
  memoryStore.addBlockedClient(blockedClient);
};
