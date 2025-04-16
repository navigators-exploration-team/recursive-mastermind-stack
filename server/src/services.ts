import WebSocket from 'ws';
import { getGameById, createOrUpdateGame } from './repositories/game.js';
import { StepProgramProof } from '@navigators-exploration-team/mina-mastermind';
import { checkGameStatus } from './zkAppHandler.js';
import { Queue } from 'bullmq';
import { VerificationKey, verify } from 'o1js';

export const handleJoinGame = async (
  gameId: string,
  activePlayers: Map<string, Set<WebSocket>>,
  ws: WebSocket
) => {
  let game = await getGameById(gameId);
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
  receivedMaxAttempts: number,
  receivedRewardAmount: number,
  playerPubKeyBase58: string,
  activePlayers: Map<string, Set<WebSocket>>,
  ws: WebSocket,
  proofQueue: Queue,
  vk: VerificationKey
) => {
  let game = await getGameById(gameId);

  let lastProof = game?.lastProof || null;

  let lastTurnCount = null;
  const gameMaxAttempts = game?.maxAttempts || receivedMaxAttempts;
  const gameRewardAmount = game?.rewardAmount || receivedRewardAmount;

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
    await verify(receivedProof, vk);
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
  await createOrUpdateGame({
    _id: gameId,
    lastProof: zkProof,
    timestamp,
    maxAttempts: gameMaxAttempts,
    rewardAmount: gameRewardAmount,
    codeMaster: lastTurnCount === null && playerPubKeyBase58 ? playerPubKeyBase58 : undefined,
  });

  const players = activePlayers.get(gameId) || new Set();
  players.forEach((player: WebSocket) => {
    if (player !== ws) {
      player.send(JSON.stringify({ zkProof, timestamp }));
    }
  });
  if (isSolved || (turnCount && maxAttempts && turnCount > maxAttempts * 2)) {
    const winnerPublicKeyBase58 = isSolved ? game?.codeBreaker : game?.codeMaster
    await proofQueue.add('sendFinalProof', { gameId, zkProof, winnerPublicKeyBase58 });
  }
};
