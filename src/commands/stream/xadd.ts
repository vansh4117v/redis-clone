import { memoryStore } from "../../store/memoryStore";
import { createValue, resp, type RESPBulkString, type RESPError } from "../../utils/types";
import { notifyBlockedStreamClients } from "./xread";

export const xaddHandler = (commands: string[]): RESPError | RESPBulkString => {
  if (commands.length < 4 || (commands.length - 3) % 2 !== 0) {
    return resp.error("ERR wrong number of arguments for 'XADD' command");
  }

  const key = commands[1];
  const id = commands[2];
  const fieldValues = commands.slice(3);

  let stream = memoryStore.get(key);

  if (stream && stream.type !== "stream") {
    return resp.error("WRONGTYPE Operation against a key holding the wrong kind of value");
  }

  if (!stream) {
    stream = createValue.stream({
      lastId: { ms: 0, seq: 0 },
      entries: [],
    });
  }

  const lastId = stream.value.lastId;

  if (id !== "*" && !/^\d+(-(\d+|\*))?$/.test(id)) {
    return resp.error("ERR Invalid stream ID specified as stream command argument");
  }

  let ms: number;
  let seq: number;

  if (id === "*") {
    const now = Date.now();
    if (now > lastId.ms) {
      ms = now;
      seq = 0;
    } else {
      ms = lastId.ms;
      seq = lastId.seq + 1;
    }
  } else {
    const [msStr, seqStr = "0"] = id.split("-");
    ms = Number(msStr);

    if (!isFinite(ms) || ms < 0 || !Number.isInteger(ms) || ms > Number.MAX_SAFE_INTEGER) {
      return resp.error("ERR Invalid stream ID specified as stream command argument");
    }

    if (seqStr === "*") {
      if (ms > lastId.ms) {
        seq = 0;
      } else if (ms === lastId.ms) {
        seq = lastId.seq + 1;
      } else {
        return resp.error(
          "ERR The ID specified in XADD is equal or smaller than the target stream top item"
        );
      }
    } else {
      seq = Number(seqStr);
      
      if (!isFinite(seq) || seq < 0 || !Number.isInteger(seq) || seq > Number.MAX_SAFE_INTEGER) {
        return resp.error("ERR Invalid stream ID specified as stream command argument");
      }      if (ms === 0 && seq === 0) {
        return resp.error("ERR The ID specified in XADD must be greater than 0-0");
      }
      if (ms < lastId.ms || (ms === lastId.ms && seq <= lastId.seq)) {
        return resp.error(
          "ERR The ID specified in XADD is equal or smaller than the target stream top item"
        );
      }
    }
  }

  const entryId = `${ms}-${seq}`;

  stream.value.entries.push({
    id: entryId,
    data: [...fieldValues],
  });

  stream.value.lastId = { ms, seq };
  memoryStore.set(key, stream);
  notifyBlockedStreamClients(key);
  return resp.bulk(entryId);
};
