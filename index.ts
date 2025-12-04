import { parseRESP } from "./src/protocol/parseRESP";
import net from "net";
import { commandHandler } from "./src/commands/commandHandler";
import { memoryStore } from "./src/store/memoryStore";

const server = net.createServer((connection) => {
  const clientId = `${connection.remoteAddress}:${connection.remotePort}`;

  connection.on("data", (data) => {
    const commands = parseRESP(data);
    commandHandler(commands, connection);
  });

  connection.on("close", () => {
    memoryStore.removeBlockedClientById(clientId);
    memoryStore.deleteTransaction(clientId);
    console.log(`Client disconnected: ${clientId}`);
  });

  connection.on("error", (err) => {
    console.error(`Client ${clientId} error:`, err.message);
  });
});

server.listen({ port: 8001 }, () => {
  console.log("Server is listening on port 8001");
});
