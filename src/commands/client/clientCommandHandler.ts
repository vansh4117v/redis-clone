import { RedisConnection, resp } from "../../utils/types.js";
import { clientCommandRegistry } from "./clientCommandRegistry.js";

export const clientCommandHandler = (commands: string[], connection: RedisConnection) => {
  if (commands.length < 2) {
    return resp.error("ERR wrong number of arguments for 'client' command");
  }

  const subcommand = commands[1].toLowerCase();

  if (subcommand in clientCommandRegistry) {
    const handler = clientCommandRegistry[subcommand];
    return handler(commands, connection);
  }
  else {
    return resp.error(`ERR unknown subcommand '${subcommand}' for 'client' command`);
  }

};
