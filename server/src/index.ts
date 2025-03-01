import WebSocket, { WebSocketServer } from "ws";

const PORT = 3000;
const server = new WebSocketServer({ port: PORT });

console.log(`Server running on ws://localhost:${PORT}`);

server.on("connection", (ws: WebSocket) => {
  console.log("New client connected.");

  ws.on("message", (message: string) => {
    try {
      const data = JSON.parse(message);
      console.log("received data ", data);
    } catch (error) {
      console.error(" Error: ", error);
    }
  });

  ws.on("close", () => {
    console.log("connection closed ...");
  });
});
