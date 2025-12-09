import {
  BlockedClient,
  RedisConnection,
  resp,
  StreamValue,
  type RESPReply,
} from "../../utils/types.js";
import { memoryStore } from "../../store/memoryStore.js";
import { findEntryIndex } from "./utils.js";
import { encodeRESP } from "../../protocol/encodeRESP.js";

const validateId = (id: string): { ms: number; seq: number } | null => {
  // Must match pattern: digits-digits or just digits
  if (!/^\d+(-\d+)?$/.test(id)) {
    return null;
  }

  const parts = id.split("-");
  const ms = Number(parts[0]);

  if (!isFinite(ms) || ms < 0 || !Number.isInteger(ms) || ms > Number.MAX_SAFE_INTEGER) {
    return null;
  }

  let seq = 0;
  if (parts.length === 2) {
    seq = Number(parts[1]);

    if (!isFinite(seq) || seq < 0 || !Number.isInteger(seq) || seq > Number.MAX_SAFE_INTEGER) {
      return null;
    }
  }

  return { ms, seq };
};

export const xreadHandler = (commands: string[], connection: RedisConnection): RESPReply | void => {
  let i = 1;
  let maxCount = Infinity;
  let timeout: number | null = null;
  const responses: RESPReply[] = [];
  const blockedStreams = new Map<string, { ms: number; seq: number }>();

  if (i >= commands.length) {
    return resp.error("ERR wrong number of arguments for 'xread' command");
  }

  if (commands[i].toUpperCase() === "COUNT") {
    i++;
    if (i >= commands.length) {
      return resp.error("ERR syntax error");
    }
    maxCount = parseInt(commands[i]);
    if (isNaN(maxCount)) {
      return resp.error("ERR value is not an integer or out of range");
    }
    if (maxCount <= 0) {
      return resp.array(null);
    }
    i++;
  }
  if (i >= commands.length) {
    return resp.error("ERR wrong number of arguments for 'xread' command");
  }
  if (commands[i].toUpperCase() === "BLOCK") {
    i++;
    if (i >= commands.length) {
      return resp.error("ERR syntax error");
    }
    timeout = parseFloat(commands[i]);
    if (isNaN(timeout) || timeout < 0) {
      return resp.error("ERR timeout is not an integer or out of range");
    }
    i++;
  }
  if (i >= commands.length || commands[i].toUpperCase() !== "STREAMS") {
    return resp.error("ERR syntax error");
  }
  i++;

  const startIndex = i;
  const streamCount = (commands.length - i) / 2;

  if (!Number.isInteger(streamCount) || streamCount <= 0) {
    return resp.error("ERR syntax error");
  }

  // Validate all IDs and check stream types first, store validated IDs
  const validatedIds: Array<{ ms: number; seq: number } | "$" | "+"> = [];

  for (let j = 0; j < streamCount; j++) {
    const key = commands[startIndex + j];
    const id = commands[startIndex + streamCount + j];
    const stream = memoryStore.get(key);

    if (stream && stream.type !== "stream") {
      return resp.error("WRONGTYPE Operation against a key holding the wrong kind of value");
    }

    if (id === "$" || id === "+") {
      validatedIds.push(id);
    } else {
      const validatedId = validateId(id);
      if (!validatedId) {
        return resp.error("ERR Invalid stream ID specified as stream command argument");
      }
      validatedIds.push(validatedId);
    }
  }

  // Now process the streams
  for (let j = 0; j < streamCount; j++) {
    const key = commands[startIndex + j];
    const id = validatedIds[j];
    const stream = memoryStore.get(key) as StreamValue | undefined;

    if (!stream) {
      if (timeout !== null) {
        blockedStreams.set(key, { ms: 0, seq: 0 });
      }
      continue;
    }

    if (id === "$") {
      if (timeout !== null) {
        blockedStreams.set(key, stream.value.lastId);
      }
      continue;
    }

    const streamEntries: RESPReply[] = [];

    if (id === "+") {
      if (stream.value.entries.length > 0) {
        const lastEntry = stream.value.entries[stream.value.entries.length - 1];
        streamEntries.push(
          resp.array([
            resp.bulk(lastEntry.id),
            resp.array(lastEntry.data.map((item) => resp.bulk(item))),
          ])
        );
      }
    } else {
      // id is guaranteed to be { ms: number; seq: number } here
      const validatedId = id as { ms: number; seq: number };
      const index = findEntryIndex(stream.value.entries, validatedId, false);
      if (index === -1) {
        if (timeout !== null) {
          blockedStreams.set(key, validatedId);
        }
        continue;
      }

      // findEntryIndex with inclusive=false returns first entry > targetId
      let currentIndex = index;
      let count = 0;
      while (currentIndex < stream.value.entries.length && count < maxCount) {
        const entry = stream.value.entries[currentIndex];
        streamEntries.push(
          resp.array([resp.bulk(entry.id), resp.array(entry.data.map((item) => resp.bulk(item)))])
        );
        count++;
        currentIndex++;
      }
    }

    if (streamEntries.length > 0) {
      responses.push(resp.array([resp.bulk(key), resp.array(streamEntries)]));
    }
  }

  if (
    timeout !== null &&
    responses.length === 0 &&
    blockedStreams.size > 0 &&
    !(connection.transaction && connection.transaction.inMulti)
  ) {
    const blockedClient: BlockedClient = {
      id: connection.remoteAddress + ":" + connection.remotePort,
      socket: connection,
      keys: Array.from(blockedStreams.keys()),
      deadline: timeout === 0 ? null : Date.now() + timeout,
      streamIds: blockedStreams,
      maxCount: maxCount,
    };
    memoryStore.addBlockedClient(blockedClient);
    return; // No immediate response
  } else if (responses.length > 0) {
    return resp.array(responses);
  } else {
    return resp.array(null);
  }
};

export const notifyBlockedStreamClients = (key: string) => {
  const now = Date.now();
  const blockedClients = memoryStore.getBlockedClients(key);

  for (const client of blockedClients) {
    if (!client.streamIds) continue; // Not a stream blocked client

    if (client.deadline === null || client.deadline > now) {
      const maxCount = client.maxCount ?? Infinity;
      const responses: RESPReply[] = [];

      for (const streamKey of client.keys) {
        const stream = memoryStore.get(streamKey);
        if (!stream || stream.type !== "stream") continue;

        const lastSeenId = client.streamIds.get(streamKey);
        if (!lastSeenId) continue;

        const index = findEntryIndex(stream.value.entries, lastSeenId, false);
        if (index === -1 || index >= stream.value.entries.length) continue;

        const streamEntries: RESPReply[] = [];
        let currentIndex = index;
        let count = 0;
        while (currentIndex < stream.value.entries.length && count < maxCount) {
          const entry = stream.value.entries[currentIndex];
          streamEntries.push(
            resp.array([resp.bulk(entry.id), resp.array(entry.data.map((item) => resp.bulk(item)))])
          );
          count++;
          currentIndex++;
        }

        if (streamEntries.length > 0) {
          responses.push(resp.array([resp.bulk(streamKey), resp.array(streamEntries)]));
        }
      }

      if (responses.length > 0) {
        const response = resp.array(responses);

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
