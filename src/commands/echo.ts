import { resp, type RedisBulkString, type RESPError } from "../utils/types";

export const echoHandler = (commands: string[]): RedisBulkString | RESPError => {
  if (commands.length !== 2) {
    return resp.error("ERR wrong number of arguments for 'echo' command");
  }
  return resp.bulk(commands[1]);
};
