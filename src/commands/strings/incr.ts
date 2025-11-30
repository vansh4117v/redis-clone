import { memoryStore } from "../../store/memoryStore";
import { resp, type RESPError, type RESPInteger } from "../../utils/types";

const MIN = -(1n << 63n); // -2^63
const MAX = (1n << 63n) - 1n; // 2^63 - 1

export const incrHandler = (commands: string[]): RESPInteger | RESPError => {
  if (commands.length !== 2) {
    return resp.error("ERR wrong number of arguments for 'incr' command");
  }

  const key = commands[1];
  const storedValue = memoryStore.get(key);

  if (!storedValue) {
    memoryStore.set(key, { type: "string", value: "1" });
    return resp.integer(1);
  }
  if (storedValue.type !== "string") {
    return resp.error("WRONGTYPE Operation against a key holding the wrong kind of value");
  }

  if (!/^[-+]?\d+$/.test(storedValue.value)) {
    return resp.error("ERR value is not an integer or out of range");
  }

  const num = BigInt(storedValue.value);
  if (num < MIN || num > MAX) {
    return resp.error("ERR value is not an integer or out of range");
  }

  const incremented = num + 1n;
  if (incremented < MIN || incremented > MAX) {
    return resp.error("ERR value is not an integer or out of range");
  }

  storedValue.value = String(incremented);
  memoryStore.set(key, storedValue);
  return resp.integer(incremented);
};
