import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import { checkGameProgress, setupContract } from "./zkAppHandler.js";
import { StepProgramProof } from "@navigators-exploration-team/mina-mastermind";
import { getGame, saveGame } from "./kvStorageService.js";

const app = express();   
const PORT = 3000;    
setupContract();
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const wss = new WebSocketServer({ server });

const activePlayers = new Map<string, Set<WebSocket>>();
              
wss.on("connection", (ws) => {   
  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message.toString());
      const { gameId, action, zkProof } = data;

      if (!gameId || !action) {
        ws.send(JSON.stringify({ error: "Bad request!" }));
        return;
      }
      if (action === "join") {
        let game = await getGame(gameId);
        let lastProof = game?.lastProof || null;
        let timestamp = game?.timestamp || null;
        if (!activePlayers.has(gameId)) {
          activePlayers.set(gameId, new Set());
        }
        activePlayers.get(gameId)?.add(ws);
        if (lastProof) {
          ws.send(JSON.stringify({ zkProof: lastProof, timestamp }));
        }
      } else if (action === "sendProof") {

        if (!zkProof) {
          ws.send(JSON.stringify({ error: "Missing zkProof!" }));
          return;
        }

        let receivedProof;
        try {
          receivedProof = await StepProgramProof.fromJSON(JSON.parse(zkProof));
          receivedProof.verify();
          if (
            Number(receivedProof.publicOutput.turnCount.toString()) % 2 !==
            0
          ) {
            await checkGameProgress(gameId, receivedProof);
          }
        } catch (e) {
          ws.send(JSON.stringify({ error: "Invalid zkProof!" }));
          return;
        } 

        const timestamp = Date.now();
        await saveGame(gameId, { lastProof: zkProof, timestamp });
        const players = activePlayers.get(gameId) || new Set();
        players.forEach((player: WebSocket) => {
          if (player !== ws) {
            player.send(JSON.stringify({ zkProof, timestamp }));
          }
        });
      } else {
        ws.send(JSON.stringify({ error: "Unknown action!" }));
      }
    } catch (err) {
      ws.send(JSON.stringify({ error: "Internal error!" }));
    }
  });

  ws.on("close", () => {
    activePlayers.forEach((players, gameId) => {
      players.delete(ws);
      if (players.size === 0) {
        activePlayers.delete(gameId);
      }
    });
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err);
  });
});
