import { encodeRESP } from "../../protocol/encodeRESP.js";
import { memoryStore } from "../../store/memoryStore.js";
import { resp, type RedisConnection } from "../../utils/types.js";

export const unsubscribeHandler = (commands: string[], connection: RedisConnection) => {
  let channels: string[];
  if (commands.length === 1) {
    channels = Array.from(connection.pubSub?.channels || []);
    if (channels.length === 0) {
      connection.write(
        encodeRESP(
          resp.array([resp.bulk("unsubscribe"), resp.bulk(null), resp.integer(0)])
        )
      );
      return;
    }
  } else {
    channels = commands.slice(1);
  }
  const channelsSet = connection.pubSub?.channels || new Set<string>();

  for (const channel of channels) {
    channelsSet.delete(channel);
    memoryStore.removeSubscriptionChannel(channel, connection);
    connection.write(
      encodeRESP(
        resp.array([resp.bulk("unsubscribe"), resp.bulk(channel), resp.integer(channelsSet.size)])
      )
    );
  }
  connection.pubSub = { channels: channelsSet, isPubSub: channelsSet.size > 0 };
};
