import { encodeRESP } from "../../protocol/encodeRESP.js";
import { memoryStore } from "../../store/memoryStore.js";
import { resp, type RedisConnection } from "../../utils/types.js";

export const subscribeHandler = (commands: string[], connection: RedisConnection) => {
  if (commands.length < 2) {
    return resp.error("ERR wrong number of arguments for 'subscribe' command");
  }
  const inputChannels = commands.slice(1);
  for (const channel of inputChannels) {
    const subscriptionCount = memoryStore.addSubscriptionChannel(channel, connection);
    connection.write(
      encodeRESP(
        resp.array([resp.bulk("subscribe"), resp.bulk(channel), resp.integer(subscriptionCount)]),
      ),
    );
  }
};
