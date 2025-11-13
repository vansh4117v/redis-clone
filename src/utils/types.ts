import type { Socket } from "net";

export type RESPStatus = { type: "status"; value: string };
export type RedisBulkString = { type: "bulk"; value: string | null };
export type RESPInteger = { type: "integer"; value: number };
export type RESPArray = { type: "array"; value: string[] };
export type RESPError = { type: "error"; message: string };

export const resp = {
  status: (value: string): RESPStatus => ({ type: "status", value }),
  bulk: (value: string | null): RedisBulkString => ({ type: "bulk", value }),
  integer: (value: number): RESPInteger => ({ type: "integer", value }),
  array: (value: string[]): RESPArray => ({ type: "array", value }),
  error: (message: string): RESPError => ({ type: "error", message }),
};

export type RESPReply = RESPStatus | RedisBulkString | RESPInteger | RESPArray | RESPError;

export interface BlockedClient {
  id: string;
  socket: Socket;
  keys: string[];
  deadline: number | null;
}

export type StringValue = { type: "string"; value: string };
export type ListValue = { type: "list"; value: string[] };
export type SetValue = { type: "set"; value: Set<string> };
export type HashValue = { type: "hash"; value: Map<string, string> };
export type RedisStoredValue = StringValue | ListValue | SetValue | HashValue;

export const createValue = {
  string: (value: string): StringValue => ({ type: "string", value }),
  list: (value: string[]): ListValue => ({ type: "list", value }),
  set: (value: Set<string>): SetValue => ({ type: "set", value }),
  hash: (value: Map<string, string>): HashValue => ({ type: "hash", value }),
};
