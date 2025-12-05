import { memoryStore } from "../../store/memoryStore.js";
import { resp, type RESPStatus, type RESPError } from "../../utils/types.js";

export const typeHandler = (commands: string[]): RESPStatus | RESPError => {
  if (commands.length !== 2) {
    return resp.error("ERR wrong number of arguments for 'TYPE' command");
  }
  const key = commands[1];
  const value = memoryStore.get(key);
  if (!value) {
    return resp.status("none");
  }
  return resp.status(value.type);
};
