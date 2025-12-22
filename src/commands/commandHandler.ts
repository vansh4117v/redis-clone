import { type RESPReply, type RedisConnection, resp } from "../utils/types.js";
import { encodeRESP } from "../protocol/encodeRESP.js";
import { commandRegistry } from "./commandRegistry.js";
import { transactionHandler } from "./transactions/transactionHandler.js";
import { pubSubHandler } from "./pub-sub/pubSubHandler.js";

export const commandHandler = (commandArray: string[], connection: RedisConnection): void => {
  if (commandArray.length === 0) {
    connection.write(encodeRESP(resp.error("ERR unknown command")));
    return;
  }

  const command = commandArray[0].toLowerCase();
  let response: RESPReply | void;

  if (connection.pubSub?.isPubSub) {
    response = pubSubHandler(commandArray, connection);
  }

  else if (connection?.transaction?.inMulti) {
    response = transactionHandler(commandArray, connection);
  }
  else if (command === "exec" || command === "discard") {
    response = resp.error(`ERR ${command} without MULTI`);
  }
  
  else if (command in commandRegistry) {
    const handler = commandRegistry[command];
    response = handler(commandArray, connection);
  }
  else {
    response = resp.error(`ERR unknown command '${command}'`);
  }

  if (response) {
    connection.write(encodeRESP(response));
  }
};
