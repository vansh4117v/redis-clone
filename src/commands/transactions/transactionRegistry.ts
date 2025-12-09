import type { RedisConnection, RESPReply } from "../../utils/types.js";
import { execHandler } from "./execHandler.js";
import { discardHandler } from "./discardHandler.js";

type TransactionCommandHandler = (commands: string[], connection: RedisConnection) => RESPReply;

export const transactionCommandsRegistry: Record<string, TransactionCommandHandler> = {
  exec: execHandler,
  discard: discardHandler,
};
