import type { RESPReply } from "../utils/types";

export const encodeRESP = (reply: RESPReply): string => {
  switch (reply.type) {
    case "status":
      return `+${reply.value}\r\n`;
    case "bulk":
      if (reply.value === null) return `$-1\r\n`;
      return `$${Buffer.byteLength(reply.value)}\r\n${reply.value}\r\n`;
    case "integer":
      return `:${reply.value}\r\n`;
    case "error":
      return `-${reply.message}\r\n`;
    case "array":
      return (
        `*${reply.value.length}\r\n` +
        reply.value.map((str) => encodeRESP({ type: "bulk", value: str })).join("")
      );
    default:
      return `-ERR unknown reply type\r\n`;
  }
};
