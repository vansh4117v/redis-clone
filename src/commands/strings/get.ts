import { memoryStore } from "../../store/memoryStore.js";
import { resp, type RESPBulkString, type RESPError } from "../../utils/types.js";

export const getHandler = (commands: string[]): RESPError | RESPBulkString => {
  if (commands.length !== 2) {
    return resp.error("ERR wrong number of arguments for 'get' command");
  }
  const key = commands[1];
  const stored = memoryStore.get(key);
  if (!stored) {
    return resp.bulk(null);
  }
  if (stored.type !== "string") {
    return resp.error("WRONGTYPE Operation against a key holding the wrong kind of value");
  }
  return resp.bulk(stored.value);
};
