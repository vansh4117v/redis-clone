import { RedisConnection, resp } from "../../utils/types.js"

export const setinfoHandler = (commands: string[], connection: RedisConnection) => {
  if (commands.length !== 4) {
    return resp.error("ERR wrong number of arguments for 'client setinfo' command");
  }
  const infoType = commands[2].toLowerCase();
  const infoValue = commands[3];

  if (infoType === "lib-ver") {
    connection.clientInfo.libVersion = infoValue;
  } else if (infoType === "lib-name") {
    connection.clientInfo.libName = infoValue;
  }
  else {
    return resp.error(`ERR Unrecognized option '${infoType}'`);
  }
  return resp.status("OK");
}