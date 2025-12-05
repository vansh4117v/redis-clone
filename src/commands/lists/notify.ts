import { memoryStore } from "../../store/memoryStore.js";
import { resp } from "../../utils/types.js";
import { encodeRESP } from "../../protocol/encodeRESP.js";

export const notifyBlockedClients = (key: string): void => {
  const now = Date.now();
  const blockedClients = memoryStore.getBlockedClients(key);

  for (const client of blockedClients) {
    if (client.deadline === null || client.deadline > now) {
      const list = memoryStore.get(key);
      if (list && list.type === "list" && list.value.length > 0) {
        const value = list.value.shift() as string;
        memoryStore.set(key, list);
        const response = resp.array([resp.bulk(key), resp.bulk(value)]);

        try {
          if (!client.socket.destroyed) {
            client.socket.write(encodeRESP(response));
          }
        } catch (err) {
          // Socket closed, ignore
        }

        memoryStore.removeBlockedClient(client);
      }
    }
  }
};
