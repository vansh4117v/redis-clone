import { encodeRESP } from "../../protocol/encodeRESP";
import { RedisConnection, resp } from "../../utils/types";
import { subscribeHandler } from "./subscribe";
import { unsubscribeHandler } from "./unsubscribe";

export const pubSubHandler = (commands: string[], connection: RedisConnection) => {
  const command = commands[0].toLowerCase();
  switch (command) {
    case "subscribe":
      return subscribeHandler(commands, connection);
    case "unsubscribe":
      return unsubscribeHandler(commands, connection);
    case "ping": {
      // In pubsub mode, PING returns ["pong", message] format
      const message = commands.length > 1 ? commands[1] : "";
      connection.write(encodeRESP(resp.array([resp.bulk("pong"), resp.bulk(message)])));
      return; 
    }
    default:
      return resp.error(
        `ERR Can't execute '${command}': only SUBSCRIBE / UNSUBSCRIBE / PING are allowed in this context`
      );
  }
};
