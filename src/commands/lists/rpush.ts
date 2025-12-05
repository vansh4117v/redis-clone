import { createValue, resp, type RESPInteger, type RESPError } from "../../utils/types.js";
import { memoryStore } from "../../store/memoryStore.js";
import { notifyBlockedClients } from "./notify.js";

export const rpushHandler = (commands: string[]): RESPInteger | RESPError => {
  if (commands.length < 3) {
    return resp.error("ERR wrong number of arguments for 'RPUSH' command");
  }

  const key = commands[1];
  const values = commands.slice(2);
  let list = memoryStore.get(key);

  if (!list) {
    list = createValue.list([]);
  } else if (list.type !== "list") {
    return resp.error("WRONGTYPE Operation against a key holding the wrong kind of value");
  }

  list.value.push(...values);
  memoryStore.set(key, list);
  const length = list.value.length;
  notifyBlockedClients(key);

  return resp.integer(length);
};
