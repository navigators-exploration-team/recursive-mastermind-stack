import WebSocket from 'ws';
import { getGame, saveGame } from './kvStorageService.js';
import { StepProgramProof } from '@navigators-exploration-team/mina-mastermind';
import { checkGameStatus } from './zkAppHandler.js';
import { Queue } from 'bullmq';

export const handleJoinGame = async (
  gameId: string,
  activePlayers: Map<string, Set<WebSocket>>,
  ws: WebSocket
) => {
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
};
export const handleProof = async (
  gameId: string,
  zkProof: string,
  activePlayers: Map<string, Set<WebSocket>>,
  ws: WebSocket,
  proofQueue: Queue
) => {
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
    console.error('Error verifying proof:', e);
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
  if (isSolved || (turnCount && maxAttempts && turnCount > maxAttempts * 2)) {
    console.log('sending proof...');
    await proofQueue.add('sendFinalProof', { gameId, zkProof });
  }
};
