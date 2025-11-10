import { parseRESP } from "./src/protocol/parseRESP.js";
import net from "net";
import { commandHandler } from "./src/commands/commandHandler.js";
import { encodeRESP } from "./src/protocol/encodeRESP.js";


const server = net.createServer((connection) => {
  connection.on("data", (data) => {
    const commands = parseRESP(data)
    if (commands.length === 0) {
      connection.write(encodeRESP(new Error('ERR unknown command')));
      return;
    }
    const response = commandHandler(commands);
    connection.write(encodeRESP(response))
  })
});

let server1 = server.listen({ port: 8001 }, () => {
  console.log("Server is listening on port 8001");
});
