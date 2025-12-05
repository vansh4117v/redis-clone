import { resp, type RESPBulkString, type RESPArray, type RESPError } from "../../utils/types.js";
import { memoryStore } from "../../store/memoryStore.js";

export const lpopHandler = (commands: string[]): RESPBulkString | RESPArray | RESPError => {
  if (commands.length !== 3 && commands.length !== 2) {
    return resp.error("ERR wrong number of arguments for 'LPOP' command");
  }

  const key = commands[1];
  const list = memoryStore.get(key);
  let count = 1;

  if (commands.length === 3) {
    count = parseInt(commands[2]);
    if (isNaN(count) || count <= 0) {
      return resp.error("ERR value is not an integer or out of range");
    }
  }

  if (!list) {
    return resp.bulk(null);
  } else if (list.type !== "list") {
    return resp.error("WRONGTYPE Operation against a key holding the wrong kind of value");
  }

  if (list.value.length === 0) {
    return resp.bulk(null);
  }

  const value = list.value.splice(0, count);
  memoryStore.set(key, list);
  if (value.length === 1) {
    return resp.bulk(value[0]);
  } else {
    return resp.array(value.map((item: string) => resp.bulk(item)));
  }
};
