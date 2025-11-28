import type { StreamEntry } from "../../utils/types";

export const compareIds = (id1: { ms: number; seq: number }, id2: { ms: number; seq: number }) => {
  if (id1.ms !== id2.ms) {
    return id1.ms - id2.ms;
  }
  return id1.seq - id2.seq;
};

export const findEntryIndex = (
  entries: StreamEntry[],
  targetId: { ms: number; seq: number },
  inclusive: boolean = false
): number => {
  let left = 0;
  let right = entries.length - 1;
  let ind = -1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const [ms, seq] = entries[mid].id.split("-").map(Number);
    const cmp = compareIds({ ms, seq }, targetId);
    if (cmp > 0 || (inclusive && cmp === 0)) {
      ind = mid;
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }
  return ind;
};

