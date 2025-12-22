import { encodeRESP } from "../../protocol/encodeRESP.js";
import { memoryStore } from "../../store/memoryStore.js";
import { resp, type RedisConnection, } from "../../utils/types.js";

export const subscribeHandler = (commands: string[], connection: RedisConnection) => {
  if (commands.length < 2) {
    return resp.error("ERR wrong number of arguments for 'subscribe' command");
  }
  const channels = commands.slice(1);
  const channelsSet = connection.pubSub?.channels || new Set<string>();


  connection.pubSub = { channels: channelsSet, isPubSub: true };
  memoryStore.addSubscription(channels, connection);

  for (const channel of channels) {
    channelsSet.add(channel);
    connection.write(
      encodeRESP(
        resp.array([resp.bulk("subscribe"), resp.bulk(channel), resp.integer(channelsSet.size)])
      )
    );
  }
};
