import { execHandler } from "./execHandler";
import { discardHandler } from "./discardHandler";
import type { Socket } from "net";
import type { RESPReply } from "../../utils/types";

type TransactionCommandHandler = (
  commands: string[],
  connection: Socket,
  socketId: string
) => RESPReply;

export const transactionCommandsRegistry: Record<string, TransactionCommandHandler> = {
  exec: execHandler,
  discard: discardHandler,
};
