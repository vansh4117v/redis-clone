import { pingHandler } from "./ping.js";
import { echoHandler } from "./echo.js";
import { setHandler } from "./set.js";
import { getHandler } from "./get.js";
import { lpushHandler, lrangeHandler, rpushHandler } from "./list.js";

const commandHandlerMapping = {
  ping: pingHandler,
  echo: echoHandler,
  set: setHandler,
  get: getHandler,
  rpush: rpushHandler,
  lrange: lrangeHandler,
  lpush: lpushHandler,
};

export const commandHandler = (commandArray) => {
  const command = commandArray[0].toLowerCase();
  const handler = commandHandlerMapping[command];
  if (handler) {
    const response = handler(commandArray);
    if (!response) return null;
    return response;
  } else {
    return new Error(`ERR unknown command '${command}'`);
  }
};
