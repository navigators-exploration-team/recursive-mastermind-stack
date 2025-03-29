import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { Queue, QueueEvents } from 'bullmq';
import { setupContract } from './zkAppHandler.js';
import dotenv from 'dotenv';
import { handleJoinGame, handleProof } from './services.js';
import cors from 'cors';
import gamesRoute from './routes/gamesRoute.js';

dotenv.config();

const app = express();
app.use(cors());

app.use(express.json());

const PORT = process.env.SERVER_PORT;
const REDIS_PORT = parseInt(process.env.REDIS_PORT as string) || 6379;
const REDIS_HOST = process.env.REDIS_HOST;
setupContract();
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.use('/games', gamesRoute);

const wss = new WebSocketServer({ server });
const activePlayers = new Map<string, Set<WebSocket>>();

const proofQueue = new Queue('proofQueue', {
  connection: { host: REDIS_HOST, port: REDIS_PORT },
});
const queueEvents = new QueueEvents('proofQueue', {
  connection: { host: REDIS_HOST, port: REDIS_PORT },
});

queueEvents.on('completed', ({ jobId, returnvalue }: any) => {
  console.log(`Job ${jobId} completed, transaction hash: ${returnvalue}`);
});

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
        console.log('joined a game!');
        handleJoinGame(gameId, activePlayers, ws);
      } else if (action === 'sendProof') {
        console.log('received a proof!');
        handleProof(gameId, zkProof, activePlayers, ws, proofQueue);
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
