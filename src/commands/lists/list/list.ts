import type { Socket } from "net";
import { memoryStore } from "../../../store/memoryStore";
import { BlockedClient, createValue, resp, RESPReply } from "../../../utils/types";
import { encodeRESP } from "../../../protocol/encodeRESP";

export const rpushHandler = (commands: string[]): RESPReply => {
  if (commands.length < 3) {
    return resp.error("ERR wrong number of arguments for 'RPUSH' command");
  }
  const key = commands[1];
  const values = commands.slice(2);
  let list = memoryStore.get(key);
  if (!list) {
    list = createValue.list([]);
  } else if (list.type !== "list") {
    return resp.error("WRONGTYPE Operation against a key holding the wrong kind of value");
  }
  list.value.push(...values);
  memoryStore.set(key, list);
  const length = list.value.length;
  notifyBlockedClients(key);
  return resp.integer(length);
};

export const lrangeHandler = (commands: string[]): RESPReply => {
  if (commands.length !== 4) {
    return resp.error("ERR wrong number of arguments for 'LRANGE' command");
  }
  const key = commands[1];
  const start = parseInt(commands[2]);
  const stop = parseInt(commands[3]);
  const list = memoryStore.get(key);
  if (isNaN(start) || isNaN(stop)) {
    return resp.error("ERR value is not an integer or out of range");
  }
  if (!list) {
    return resp.array([]);
  } else if (list.type !== "list") {
    return resp.error("WRONGTYPE Operation against a key holding the wrong kind of value");
  }
  const listValue = list.value;
  const adjustedStart = start < 0 ? Math.max(listValue.length + start, 0) : start;
  const adjustedStop = stop < 0 ? listValue.length + stop + 1 : stop + 1;
  const slice = listValue.slice(adjustedStart, adjustedStop);
  return resp.array(slice.map((item: string) => resp.bulk(item)));
};

export const lpushHandler = (commands: string[]): RESPReply => {
  if (commands.length < 3) {
    return resp.error("ERR wrong number of arguments for 'LPUSH' command");
  }
  const key = commands[1];
  const values = commands.slice(2);
  let list = memoryStore.get(key);
  if (!list) {
    list = createValue.list([]);
  } else if (list.type !== "list") {
    return resp.error("WRONGTYPE Operation against a key holding the wrong kind of value");
  }
  list.value.unshift(...values.reverse());
  memoryStore.set(key, list);
  const length = list.value.length;
  notifyBlockedClients(key);
  return resp.integer(length);
};

export const llenHandler = (commands: string[]): RESPReply => {
  if (commands.length !== 2) {
    return resp.error("ERR wrong number of arguments for 'LLEN' command");
  }
  const key = commands[1];
  const list = memoryStore.get(key);
  if (!list) {
    return resp.integer(0);
  } else if (list.type !== "list") {
    return resp.error("WRONGTYPE Operation against a key holding the wrong kind of value");
  }
  return resp.integer(list.value.length);
};

export const lpopHandler = (commands: string[]): RESPReply => {
  if (commands.length !== 3 && commands.length !== 2) {
    return resp.error("ERR wrong number of arguments for 'LPOP' command");
  }
  const key = commands[1];
  const list = memoryStore.get(key);
  let count = 1;
  if (commands.length === 3) {
    count = parseInt(commands[2]);
    if (isNaN(count) || count <= 0) {
      return resp.error("ERR value is not an integer or out of range");
    }
  }
  if (!list) {
    return resp.bulk(null);
  } else if (list.type !== "list") {
    return resp.error("WRONGTYPE Operation against a key holding the wrong kind of value");
  }
  if (list.value.length === 0) {
    return resp.bulk(null);
  }
  const value = list.value.splice(0, count);
  memoryStore.set(key, list);
  if (value.length === 1) {
    return resp.bulk(value[0]);
  } else {
    return resp.array(value.map((item: string) => resp.bulk(item)));
  }
};

export const blpopHandler = (commands: string[], socket: Socket): RESPReply | void => {
  if (commands.length < 3) {
    return resp.error("ERR wrong number of arguments for 'BLPOP' command");
  }
  const keys = commands.slice(1, -1);
  const timeout = parseFloat(commands[commands.length - 1]);
  if (isNaN(timeout) || timeout < 0) {
    return resp.error("ERR timeout is not a float or out of range");
  }

  for (const key of keys) {
    const stored = memoryStore.get(key);
    if (stored) {
      if (stored.type !== "list") {
        return resp.error("WRONGTYPE Operation against a key holding the wrong kind of value");
      }
      if (stored.value.length > 0) {
        const value = stored.value.shift() as string;
        memoryStore.set(key, stored);
        return resp.array([resp.bulk(key), resp.bulk(value)]);
      }
    }
  }

  const deadline = timeout === 0 ? null : Date.now() + timeout * 1000;
  const blockedClient: BlockedClient = {
    id: socket.remoteAddress + ":" + socket.remotePort,
    socket: socket,
    keys: keys,
    deadline: deadline,
  };
  memoryStore.addBlockedClient(blockedClient);
};

const notifyBlockedClients = (key: string) => {
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
