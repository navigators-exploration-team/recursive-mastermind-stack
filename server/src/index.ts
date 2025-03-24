import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import {
  checkGameStatus,
  sendFinalProofToMina,
  setupContract,
} from './zkAppHandler.js';
import { StepProgramProof } from '@navigators-exploration-team/mina-mastermind';
import { getGame, saveGame } from './kvStorageService.js';

const app = express();
const PORT = 3000;
setupContract();
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const wss = new WebSocketServer({ server });

const activePlayers = new Map<string, Set<WebSocket>>();

wss.on('connection', (ws) => {
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      const { gameId, action, zkProof } = data;

      if (!gameId || !action) {
        ws.send(JSON.stringify({ error: 'Bad request!' }));
        return;
      }
      if (action === 'join') {
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
      } else if (action === 'sendProof') {
        let game = await getGame(gameId);
        let lastProof = game?.lastProof || null;
        let lastTurnCount = null;
        if (lastProof) {
          const proof = await StepProgramProof.fromJSON(JSON.parse(lastProof));
          lastTurnCount = Number(proof.publicOutput.turnCount.toString());
        }

        if (!zkProof) {
          ws.send(JSON.stringify({ error: 'Missing zkProof!' }));
          return;
        }

        let receivedProof;
        let maxAttempts, turnCount, isSolved;
        try {
          receivedProof = await StepProgramProof.fromJSON(JSON.parse(zkProof));
          receivedProof.verify();

          const receivedTurnCount = Number(
            receivedProof.publicOutput.turnCount.toString()
          );
          if (lastTurnCount && receivedTurnCount <= lastTurnCount) {
            ws.send(JSON.stringify({ error: 'Proof is outdated!' }));
            return;
          }

          if (receivedTurnCount % 2 !== 0) {
            const {
              maxAttempts: maxAttempts_,
              turnCount: turnCount_,
              isSolved: isSolved_,
            } = await checkGameStatus(gameId, receivedProof);

            maxAttempts = maxAttempts_;
            turnCount = turnCount_;
            isSolved = isSolved_;
          }
        } catch (e) {
          ws.send(JSON.stringify({ error: 'Invalid zkProof!' }));
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

        console.log(isSolved, turnCount, maxAttempts);

        if (
          isSolved ||
          (turnCount &&
          maxAttempts &&
          turnCount > maxAttempts * 2)
        ) {
          const hash = await sendFinalProofToMina(gameId, receivedProof);
          players.forEach((player: WebSocket) => {
            if (player !== ws) {
              player.send(JSON.stringify({ hash }));
            }
          });
        }
      } else {
        ws.send(JSON.stringify({ error: 'Unknown action!' }));
      }
    } catch (err) {
      ws.send(JSON.stringify({ error: 'Internal error!' }));
    }
  });

  ws.on('close', () => {
    activePlayers.forEach((players, gameId) => {
      players.delete(ws);
      if (players.size === 0) {
        activePlayers.delete(gameId);
      }
    });
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});
