import { resp, type RESPArray, type RESPError } from "../../utils/types";
import { memoryStore } from "../../store/memoryStore";

export const lrangeHandler = (commands: string[]): RESPArray | RESPError => {
  if (commands.length !== 4) {
    return resp.error("ERR wrong number of arguments for 'LRANGE' command");
  }

  const key = commands[1];
  const start = parseInt(commands[2]);
  const stop = parseInt(commands[3]);
  const list = memoryStore.get(key);

  if (isNaN(start) || isNaN(stop)) {
    return resp.error("ERR value is not an integer or out of range");
  }
  if (!list) {
    return resp.array([]);
  } else if (list.type !== "list") {
    return resp.error("WRONGTYPE Operation against a key holding the wrong kind of value");
  }

  const listValue = list.value;
  const adjustedStart = start < 0 ? Math.max(listValue.length + start, 0) : start;
  const adjustedStop = stop < 0 ? listValue.length + stop + 1 : stop + 1;
  const slice = listValue.slice(adjustedStart, adjustedStop);

  return resp.array(slice.map((item: string) => resp.bulk(item)));
};
