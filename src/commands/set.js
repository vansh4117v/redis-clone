import { memoryStore } from "../store/memoryStore.js";

export const setHandler = (commands) => {
  if (commands.length < 3) {
    return new Error("ERR wrong number of arguments for 'set' command");
  }
  const [key, value, ...rest] = commands.slice(1);
  const options = {};
  for (let i = 0; i < rest.length; i++) {
    const option = rest[i].toUpperCase();
    if (option === "EX") {
      i++;
      const ttl = parseInt(rest[i]) * 1000;
      if (isNaN(ttl) || ttl <= 0) {
        return new Error("ERR invalid expire time in 'set' command");
      }
      options.ex = ttl;
    } 
    else if (option === "PX") {
      i++;
      const ttl = parseInt(rest[i]);
      if (isNaN(ttl) || ttl <= 0) {
        return new Error("ERR invalid expire time in 'set' command");
      }
      options.px = ttl;
    } else {
      return new Error(`ERR syntax error in 'set' command`);
    }
  }
  if(options.ex && options.px) {
    return new Error("ERR 'set' command can have either EX or PX option, not both");
  }
  let ttl = null;
  if (options.ex) {
    ttl = options.ex;
  } else if (options.px) {
    ttl = options.px;
  }
  memoryStore.set(key, value, ttl);
  return "OK";
}