import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import { checkGameProgress, setupContract } from "./zkAppHandler.js";
import { StepProgramProof } from "mina-mastermind-recursive";

const app = express();
const PORT = 3000;
setupContract();
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const wss = new WebSocketServer({ server });

const games = new Map<
  string,
  {
    players: Set<WebSocket>;
    lastProof: string | null;
  }
>();

wss.on("connection", (ws) => {
  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message.toString());
      const { gameId, action, zkProof } = data;

      let lastProof = zkProof;
      if (!gameId || !action) {
        ws.send(JSON.stringify({ error: "Bad request!" }));
        return;
      }
      if (action === "join") {
        if (!games.has(gameId)) {
          games.set(gameId, { players: new Set([ws]), lastProof });
        } else {
          const game = games.get(gameId)!;
          lastProof = game.lastProof;
          game.players.add(ws);
        }
        if (lastProof) {
          ws.send(JSON.stringify({ zkProof: lastProof }));
        }
      } else if (action === "sendProof") {
        let receivedProof = null;
        try {
          if (!zkProof) {
            ws.send(JSON.stringify({ error: "Missing zkProof!" }));
            return;
          }

          receivedProof = await StepProgramProof.fromJSON(JSON.parse(zkProof));
          receivedProof.verify();
          if (
            Number(receivedProof.publicOutput.turnCount.toString()) % 2 !== 0
          ) {
            await checkGameProgress(gameId, receivedProof);
          }
        } catch (e) {
          ws.send(JSON.stringify({ error: "Invalid zkProof!" }));
          return;
        }

        const game = games.get(gameId);
        if (!game) {
          ws.send(JSON.stringify({ error: "Game not found!" }));
          return;
        }

        game.lastProof = zkProof;
        games.set(gameId, game);
        game.players.forEach((player) => {
          if (player !== ws) {
            player.send(JSON.stringify({ zkProof }));
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
    for (const [_, game] of games) {
      game.players.delete(ws);
    }
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err);
  });
});
