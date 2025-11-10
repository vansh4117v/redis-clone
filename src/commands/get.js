import { memoryStore } from "../store/memoryStore.js";

export const getHandler = (commands) => {
  if (commands.length !== 2) {
    return new Error("ERR wrong number of arguments for 'get' command");
  }
  const key = commands[1];
  const value = memoryStore.get(key);
  if (value === undefined) {
    return null;
  }
  return value;
};
