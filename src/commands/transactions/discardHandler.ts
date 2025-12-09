import { type RedisConnection, resp, type RESPError, type RESPStatus } from "../../utils/types.js";

export const discardHandler = (
  commands: string[],
  connection: RedisConnection
): RESPStatus | RESPError => {
  if (commands.length !== 1) {
    return resp.error("ERR wrong number of arguments for 'discard' command");
  }
  connection.transaction = undefined;
  return resp.status("OK");
};
