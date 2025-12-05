import { resp, type RESPInteger, type RESPError } from "../../utils/types.js";
import { memoryStore } from "../../store/memoryStore.js";

export const llenHandler = (commands: string[]): RESPInteger | RESPError => {
  if (commands.length !== 2) {
    return resp.error("ERR wrong number of arguments for 'LLEN' command");
  }

  const key = commands[1];
  const list = memoryStore.get(key);

  if (!list) {
    return resp.integer(0);
  } else if (list.type !== "list") {
    return resp.error("WRONGTYPE Operation against a key holding the wrong kind of value");
  }

  return resp.integer(list.value.length);
};
