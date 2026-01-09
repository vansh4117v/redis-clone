import { RedisConnection, RESPReply } from "../../utils/types.js"
import { setinfoHandler } from "./setinfoHandler.js"

type CommandHandler = (commands: string[], connection: RedisConnection) => RESPReply

export const clientCommandRegistry: Record<string, CommandHandler> = {
  setinfo:setinfoHandler,
}