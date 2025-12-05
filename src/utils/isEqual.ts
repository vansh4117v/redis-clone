import { type RedisStoredValue } from "./types.js";

export function isEqual(a: RedisStoredValue | undefined, b: RedisStoredValue | undefined): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.type !== b.type) return false;

  // Have to cast to 'any' to make typescript happy
  const valA = (a as any).value;
  const valB = (b as any).value;

  if (valA === valB) return true;

  if (valA && valB && typeof valA === "object" && typeof valB === "object") {
    if (valA instanceof Map && valB instanceof Map) {
      if (valA.size !== valB.size) return false;
      for (const [key, value] of valA) {
        if (!valB.has(key) || valB.get(key) !== value) {
          return false;
        }
      }
      return true;
    }

    if (valA instanceof Set && valB instanceof Set) {
      if (valA.size !== valB.size) return false;
      for (const value of valA) {
        if (!valB.has(value)) {
          return false;
        }
      }
      return true;
    }

    if (valA.constructor !== valB.constructor) return false;

    let length = Object.keys(valA).length;
    if (length !== Object.keys(valB).length) return false;

    for (const key in valA) {
      if (valB.hasOwnProperty(key)) {
        if (!isEqual(valA[key], valB[key])) return false;
      } else {
        return false;
      }
    }
    return true;
  }
  return false;
}
