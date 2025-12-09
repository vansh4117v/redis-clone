import { parseRESP } from "./src/protocol/parseRESP.js";
import net from "net";
import { commandHandler } from "./src/commands/commandHandler.js";
import { memoryStore } from "./src/store/memoryStore.js";
import { RedisConnection } from "./src/utils/types.js";

const server = net.createServer((connection: RedisConnection) => {
  const clientId = `${connection.remoteAddress}:${connection.remotePort}`;

  connection.on("data", (data) => {
    const commands = parseRESP(data);
    commandHandler(commands, connection);
  });

  connection.on("close", () => {
    memoryStore.removeBlockedClientById(clientId);
    console.log(`Client disconnected: ${clientId}`);
  });

  connection.on("error", (err) => {
    console.error(`Client ${clientId} error:`, err.message);
  });
});

server.listen({ port: 8001 }, () => {
  console.log("Server is listening on port 8001");
});
