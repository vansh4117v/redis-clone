import { memoryStore } from "../store/memoryStore.js";

export const rpushHandler = (commands) => {
  if (commands.length < 3) {
    return new Error("ERR wrong number of arguments for 'RPUSH' command");
  }
  const key = commands[1];
  const values = commands.slice(2);
  let list = memoryStore.get(key);
  if (!list) {
    list = [];
  } else if (!Array.isArray(list)) {
    return new Error("WRONGTYPE Operation against a key holding the wrong kind of value");
  }
  list.push(...values);
  memoryStore.set(key, list);
  return list.length;
}

export const lrangeHandler = (commands) => {
  if (commands.length !== 4) {
    return new Error("ERR wrong number of arguments for 'LRANGE' command");
  }
  const key = commands[1];
  const start = parseInt(commands[2]);
  const stop = parseInt(commands[3]);
  const list = memoryStore.get(key);
  if (isNaN(start) || isNaN(stop)) {
    return new Error("ERR value is not an integer or out of range");
  }
  if (!list) {
    return [];
  } else if (!Array.isArray(list)) {
    return new Error("WRONGTYPE Operation against a key holding the wrong kind of value");
  }
  const adjustedStart = start < 0 ? Math.max(list.length + start, 0) : start;
  const adjustedStop = stop < 0 ? list.length + stop + 1 : stop + 1;
  return list.slice(adjustedStart, adjustedStop);
}

export const lpushHandler = (commands) => {
  if (commands.length < 3) {
    return new Error("ERR wrong number of arguments for 'LPUSH' command");
  }
  const key = commands[1];
  const values = commands.slice(2);
  let list = memoryStore.get(key);
  if (!list) {
    list = [];
  } else if (!Array.isArray(list)) {
    return new Error("WRONGTYPE Operation against a key holding the wrong kind of value");
  }
  list.unshift(...values.reverse());
  memoryStore.set(key, list);
  return list.length;
}