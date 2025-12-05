import type { Socket } from "net";
import { resp, type RESPError, type RESPStatus } from "../../utils/types.js";
import { memoryStore } from "../../store/memoryStore.js";

export const discardHandler = (
  commands: string[],
  connection: Socket,
  socketId: string
): RESPStatus | RESPError => {
  if (commands.length !== 1) {
    return resp.error("ERR wrong number of arguments for 'discard' command");
  }
  memoryStore.deleteTransaction(socketId);
  return resp.status("OK");
};
