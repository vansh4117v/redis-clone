import type { Socket } from "net";
import type { RESPReply } from "../../utils/types.js";
import { execHandler } from "./execHandler.js";
import { discardHandler } from "./discardHandler.js";

type TransactionCommandHandler = (
  commands: string[],
  connection: Socket,
  socketId: string
) => RESPReply;

export const transactionCommandsRegistry: Record<string, TransactionCommandHandler> = {
  exec: execHandler,
  discard: discardHandler,
};
