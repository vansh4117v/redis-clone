import { resp, type RESPBulkString, type RESPError } from "../../utils/types.js";

export const echoHandler = (commands: string[]): RESPBulkString | RESPError => {
  if (commands.length !== 2) {
    return resp.error("ERR wrong number of arguments for 'echo' command");
  }
  return resp.bulk(commands[1]);
};
