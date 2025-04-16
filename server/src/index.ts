import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { Queue, QueueEvents } from 'bullmq';
import { setupContract } from './zkAppHandler.js';
import dotenv from 'dotenv';
import {
  handleGameStart,
  handleJoinGame,
  handlePenalize,
  handleProof,
} from './services.js';
import cors from 'cors';
import gamesRoute from './routes/gamesRoute.js';
import cron from 'node-cron';
import { connectDatabase } from './databaseConnection.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.SERVER_PORT || 3000;
const REDIS_PORT = parseInt(process.env.REDIS_PORT as string) || 6379;
const REDIS_HOST = process.env.REDIS_HOST || 'redis';
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const vk = await setupContract();

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
connectDatabase();
app.use('/games', gamesRoute);

const wss = new WebSocketServer({ server });
const activePlayers = new Map<string, Set<WebSocket>>();

const proofQueue = new Queue('proofQueue', {
  connection: { host: REDIS_HOST, port: REDIS_PORT, password: REDIS_PASSWORD },
});
const queueEvents = new QueueEvents('proofQueue', {
  connection: { host: REDIS_HOST, port: REDIS_PORT, password: REDIS_PASSWORD },
});

queueEvents.on('completed', ({ returnvalue }: any) => {
  if (returnvalue) {
    const players = activePlayers.get(returnvalue._id) || new Set();
    players.forEach((player: WebSocket) => {
      player.send(JSON.stringify({ game: returnvalue }));
    });
  }
});
cron.schedule('* * * * *', async () => {
  await proofQueue.add('checkGameCreation', {});
});

wss.on('connection', (ws) => {
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      const {
        gameId,
        action,
        zkProof,
        maxAttempts,
        rewardAmount,
        playerPubKeyBase58,
      } = data;
      console.log('action : ', action);
      if (!gameId || !action) {
        ws.send(JSON.stringify({ error: 'Bad request!' }));
        return;
      }

      if (action === 'join') {
        console.log('joined a game!');
        await handleJoinGame(gameId, activePlayers, ws);
      } else if (action === 'sendProof') {
        console.log('received a proof!');
        await handleProof(
          gameId,
          zkProof,
          maxAttempts,
          rewardAmount,
          playerPubKeyBase58,
          activePlayers,
          ws,
          proofQueue,
          vk
        );
      } else if (action === 'startGame') {
        console.log('starting the game!');
        await handleGameStart(gameId, activePlayers, ws, proofQueue);
      } else if (action === 'penalize') {
        await handlePenalize(gameId, activePlayers, ws, proofQueue);
      } else {
        ws.send(JSON.stringify({ error: 'Unknown action!' }));
      }
    } catch (err) {
      console.error('Error processing message:', err);
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

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});
