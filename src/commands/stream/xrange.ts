import { memoryStore } from "../../store/memoryStore";
import { resp, type RESPArray, type RESPError } from "../../utils/types";
import { compareIds, findEntryIndex } from "./utils";

export const xrangeHandler = (commands: string[]): RESPError | RESPArray => {
  if (commands.length !== 4 && commands.length !== 6) {
    return resp.error("ERR wrong number of arguments for 'XRANGE' command");
  }

  const key = commands[1];
  const startId = commands[2];
  const endId = commands[3];
  const stream = memoryStore.get(key);
  let count = Infinity;

  if (!stream) {
    return resp.array([]);
  } else if (stream.type !== "stream") {
    return resp.error("WRONGTYPE Operation against a key holding the wrong kind of value");
  }

  if (commands.length === 6) {
    const countArg = commands[4].toUpperCase();
    if (countArg !== "COUNT") {
      return resp.error("ERR syntax error");
    }
    count = parseInt(commands[5]);
    if (isNaN(count)) {
      return resp.error("ERR value is not an integer or out of range");
    }
    // Redis returns null array for COUNT <= 0
    if (count <= 0) {
      return resp.array(null);
    }
  }

  if (
    (startId !== "-" && !/^\d+(-(\d+|\*))?$/.test(startId)) ||
    (endId !== "+" && !/^\d+(-(\d+|\*))?$/.test(endId))
  ) {
    return resp.error("ERR Invalid stream ID specified as stream command argument");
  }

  let start: { ms: number; seq: number };
  let end: { ms: number; seq: number };

  if (startId === "-") {
    start = { ms: 0, seq: 0 };
  } else {
    const parts = startId.split("-");
    const ms = Number(parts[0]);

    if (!isFinite(ms) || ms < 0 || !Number.isInteger(ms) || ms > Number.MAX_SAFE_INTEGER) {
      return resp.error("ERR Invalid stream ID specified as stream command argument");
    }

    let seq = 0;
    if (parts.length === 2 && parts[1] !== "*") {
      seq = Number(parts[1]);

      if (!isFinite(seq) || seq < 0 || !Number.isInteger(seq) || seq > Number.MAX_SAFE_INTEGER) {
        return resp.error("ERR Invalid stream ID specified as stream command argument");
      }
    }
    start = { ms, seq };
  }

  if (endId === "+") {
    end = { ms: Number.MAX_SAFE_INTEGER, seq: Number.MAX_SAFE_INTEGER };
  } else {
    const parts = endId.split("-");
    const ms = Number(parts[0]);

    if (!isFinite(ms) || ms < 0 || !Number.isInteger(ms) || ms > Number.MAX_SAFE_INTEGER) {
      return resp.error("ERR Invalid stream ID specified as stream command argument");
    }

    let seq = Number.MAX_SAFE_INTEGER;
    if (parts.length === 2 && parts[1] !== "*") {
      seq = Number(parts[1]);

      if (!isFinite(seq) || seq < 0 || !Number.isInteger(seq) || seq > Number.MAX_SAFE_INTEGER) {
        return resp.error("ERR Invalid stream ID specified as stream command argument");
      }
    }
    end = { ms, seq };
  }

  if (compareIds(start, end) > 0) {
    return resp.array([]);
  }

  const resultEntries = [];
  const startIndex = findEntryIndex(stream.value.entries, start, true);
  if (startIndex === -1) {
    return resp.array([]);
  }
  for (let i = startIndex; i < stream.value.entries.length && resultEntries.length < count; i++) {
    const entry = stream.value.entries[i];
    const [ms, seq] = entry.id.split("-").map(Number);
    const cmpEnd = compareIds({ ms, seq }, end);
    if (cmpEnd <= 0) {
      const fieldValueArray = entry.data.map((val) => resp.bulk(val));
      resultEntries.push(resp.array([resp.bulk(entry.id), resp.array(fieldValueArray)]));
    } else {
      break;
    }
  }

  return resp.array(resultEntries);
};
