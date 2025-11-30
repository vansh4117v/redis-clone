import type { Socket } from "net";

export type RESPStatus = { type: "status"; value: string };
export type RESPBulkString = { type: "bulk"; value: string | null };
export type RESPInteger = { type: "integer"; value: bigint | number };
export type RESPError = { type: "error"; message: string };
export type RESPArray = { type: "array"; value: RESPReply[] | null };

export type RESPReply = RESPStatus | RESPBulkString | RESPInteger | RESPArray | RESPError;

export const resp = {
  status: (value: string): RESPStatus => ({ type: "status", value }),
  bulk: (value: string | null): RESPBulkString => ({ type: "bulk", value }),
  integer: (value: number | bigint): RESPInteger => ({ type: "integer", value }),
  array: (value: RESPReply[] | null): RESPArray => ({ type: "array", value }),
  error: (message: string): RESPError => ({ type: "error", message }),
};

export interface BlockedClient {
  id: string;
  socket: Socket;
  keys: string[];
  deadline: number | null;

  // For XREAD: map of stream key to the ID to wait for entries after
  // For list commands: undefined
  streamIds?: Map<string, { ms: number; seq: number }>;
  maxCount?: number;
}

export type StringValue = { type: "string"; value: string };
export type ListValue = { type: "list"; value: string[] };
export type SetValue = { type: "set"; value: Set<string> };
export type HashValue = { type: "hash"; value: Map<string, string> };
export type StreamEntry = {
  id: string;
  data: string[];
};

export type StreamValue = {
  type: "stream";
  value: {
    lastId: {
      ms: number;
      seq: number;
    };
    entries: StreamEntry[];
  };
};

export type RedisStoredValue = StringValue | ListValue | SetValue | HashValue | StreamValue;

export const createValue = {
  string: (value: string): StringValue => ({ type: "string", value }),
  list: (value: string[]): ListValue => ({ type: "list", value }),
  set: (value: Set<string>): SetValue => ({ type: "set", value }),
  hash: (value: Map<string, string>): HashValue => ({ type: "hash", value }),
  stream: (value: {
    lastId: { ms: number; seq: number };
    entries: StreamEntry[];
  }): StreamValue => ({ type: "stream", value }),
};
