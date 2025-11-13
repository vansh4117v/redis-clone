import { parseRESP } from "./src/protocol/parseRESP";
import net from "net";
import { commandHandler } from "./src/commands/commandHandler";
import { encodeRESP } from "./src/protocol/encodeRESP";
import { RESPReply, resp } from "./src/utils/types";
import { memoryStore } from "./src/store/memoryStore";

const server = net.createServer((connection) => {
  const clientId = `${connection.remoteAddress}:${connection.remotePort}`;

  connection.on("data", (data) => {
    const commands = parseRESP(data);
    if (commands.length === 0) {
      connection.write(encodeRESP(resp.error("ERR unknown command")));
      return;
    }
    commandHandler(commands, connection);
  });

  connection.on("close", () => {
    memoryStore.removeBlockedClientById(clientId);
  });

  connection.on("error", (err) => {
    console.error(`Client ${clientId} error:`, err.message);
  });
});

server.listen({ port: 8001 }, () => {
  console.log("Server is listening on port 8001");
});
