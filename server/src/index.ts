import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import { StepProgramProof } from "mina-mastermind";

const app = express();
const PORT = 3000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const wss = new WebSocketServer({ server });

const games = new Map<
  string,
  {
    codeMaster: WebSocket | null;
    codeBreaker: WebSocket | null;
    lastProof: StepProgramProof | null;
  }
>();

wss.on("connection", (ws) => {
  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message.toString());
      const { gameId, action, zkProof } = data;
      let lastProof = null;
      if (action === "join") {
        if (!games.has(gameId)) {
          games.set(gameId, { codeMaster: ws, codeBreaker: null, lastProof });
        } else {
          const game = games.get(gameId)!;
          lastProof = game.lastProof;
          if (!game.codeBreaker) {
            game.codeBreaker = ws;
          } else {
            ws.send(JSON.stringify({ zkProof: lastProof }));
            return;
          }
        }
        if (lastProof) {
          ws.send(JSON.stringify({ zkProof: lastProof }));
        }
      }

      if (action === "sendProof") {
        try {
          const receivedProof = await StepProgramProof.fromJSON(
            JSON.parse(zkProof)
          );
          receivedProof.verify();
        } catch (e) {
          console.log(e);
        }
        const game = games.get(gameId);
        if (!game) {
          ws.send(JSON.stringify({ error: "Game not found" }));
          return;
        }
        games.set(gameId, { ...game, lastProof: zkProof });
        const recipient =
          game.codeMaster === ws ? game.codeBreaker : game.codeMaster;
        if (recipient) {
          recipient.send(JSON.stringify({ zkProof }));
        }
      }
    } catch (err) {
      console.error("Error: ", err);
    }
  });

  ws.on("close", () => {
    for (const [gameId, game] of games) {
      if (game.codeMaster === ws) game.codeMaster = null;
      if (game.codeBreaker === ws) game.codeBreaker = null;

      if (!game.codeMaster && !game.codeBreaker) {
        games.delete(gameId);
      }
    }
  });
});
