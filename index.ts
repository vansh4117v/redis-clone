import { parseRESP } from "./src/protocol/parseRESP.js";
import net from "net";
import { commandHandler } from "./src/commands/commandHandler.js";
import { memoryStore } from "./src/store/memoryStore.js";
import { RedisConnection } from "./src/utils/types.js";

const server = net.createServer((socket: net.Socket) => {
  const connection: RedisConnection = Object.assign(socket, {
    clientInfo: {
      addr: `${socket.remoteAddress}:${socket.remotePort}`,
    },
  });

  connection.on("data", (data) => {
    const commandArrays = parseRESP(data);
  
    for (const commands of commandArrays) {
      if (commands.length > 0) {
        commandHandler(commands, connection);
      }
    }
  });

  connection.on("close", () => {
    memoryStore.removeBlockedClientById(connection.clientInfo.addr);
    memoryStore.removeSubscriptionConnection(connection);
    console.log(`Client disconnected: ${connection.clientInfo.addr}`);
  });

  connection.on("error", (err) => {
    console.error(`Client ${connection.clientInfo.addr} error:`, err.message);
  });
});

server.listen({ port: 8001 }, () => {
  console.log("Server is listening on port 8001");
});
