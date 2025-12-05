import { memoryStore } from "../../store/memoryStore.js";
import { resp, type RESPError, type RESPStatus } from "../../utils/types.js";

export const setHandler = (commands: string[]): RESPError | RESPStatus => {
  if (commands.length < 3) {
    return resp.error("ERR wrong number of arguments for 'set' command");
  }
  const [key, value, ...rest] = commands.slice(1);
  type SetOptions = {
    ex?: number;
    px?: number;
  };
  const options: SetOptions = {};
  for (let i = 0; i < rest.length; i++) {
    const option = rest[i].toUpperCase();
    if (option === "EX") {
      i++;
      const ttl = parseInt(rest[i]) * 1000;
      if (isNaN(ttl) || ttl <= 0) {
        return resp.error("ERR invalid expire time in 'set' command");
      }
      options.ex = ttl;
    } else if (option === "PX") {
      i++;
      const ttl = parseInt(rest[i]);
      if (isNaN(ttl) || ttl <= 0) {
        return resp.error("ERR invalid expire time in 'set' command");
      }
      options.px = ttl;
    } else {
      return resp.error(`ERR syntax error in 'set' command`);
    }
  }
  if (options.ex && options.px) {
    return resp.error("ERR 'set' command can have either EX or PX option, not both");
  }
  let ttl = null;
  if (options.ex) {
    ttl = options.ex;
  } else if (options.px) {
    ttl = options.px;
  }
  const redisValue = { type: "string" as const, value: value };
  memoryStore.set(key, redisValue, ttl);
  return resp.status("OK");
};
