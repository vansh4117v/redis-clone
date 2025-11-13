import { resp, RESPStatus, type RedisBulkString, type RESPError } from "../utils/types";

export const pingHandler = (commands: string[]): RESPError | RedisBulkString | RESPStatus => {
  if (commands.length > 2) {
    return resp.error("ERR wrong number of arguments for 'ping' command");
  } else if (commands.length === 2) {
    return resp.bulk(commands[1]);
  } else {
    return resp.status("PONG");
  }
};
