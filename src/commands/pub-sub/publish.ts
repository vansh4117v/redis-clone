import { encodeRESP } from "../../protocol/encodeRESP.js";
import { memoryStore } from "../../store/memoryStore.js";
import { type RedisConnection, resp } from "../../utils/types.js";

export const publishHandler = (commands: string[], connection: RedisConnection) => {
  if (commands.length !== 3) {
    return resp.error("ERR wrong number of arguments for 'publish' command");
  }
  const channel = commands[1];
  const message = commands[2];

  const subscribers = memoryStore.getSubscribers(channel);
  let receivers = 0;
  if (subscribers) {
    receivers = subscribers.size;
    for (const subscriber of subscribers) {
      if (!subscriber.destroyed) {
        subscriber.write(
          encodeRESP(
            resp.array([resp.bulk("message"), resp.bulk(channel), resp.bulk(message)])
          )
        );
      }
    }
  }
  return resp.integer(receivers);
}