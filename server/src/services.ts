import WebSocket from 'ws';
import { getGameById, createOrUpdateGame } from './repositories/game.js';
import {
  MastermindZkApp,
  StepProgramProof,
} from '@navigators-exploration-team/mina-mastermind';
import { checkGameStatus } from './zkAppHandler.js';
import { Queue } from 'bullmq';
import { PublicKey, UInt32, VerificationKey, verify } from 'o1js';
import { GameStatus } from './models/Game.js';

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
    ws.send(JSON.stringify({ zkProof: lastProof, timestamp, game }));
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
  let { game, isPenalized } = await checkForPenalization(gameId, proofQueue);
  if (isPenalized) {
    const players = activePlayers.get(gameId) || new Set();
    players.forEach((player: WebSocket) => {
      player.send(JSON.stringify({ game }));
    });
    return;
  }
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
  let receivedTurnCount;
  try {
    receivedProof = await StepProgramProof.fromJSON(JSON.parse(zkProof));
    await verify(receivedProof, vk);
    receivedTurnCount = Number(receivedProof.publicOutput.turnCount.toString());

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
  let winnerPublicKeyBase58 = null;
  if (isSolved || (turnCount && maxAttempts && turnCount > maxAttempts * 2)) {
    winnerPublicKeyBase58 = isSolved ? game?.codeBreaker : game?.codeMaster;
    await proofQueue.add('sendFinalProof', {
      gameId,
      zkProof,
      winnerPublicKeyBase58,
    });
  }
  const timestamp = Date.now();
  const updatedGame = await createOrUpdateGame({
    _id: gameId,
    lastProof: zkProof,
    timestamp,
    maxAttempts: gameMaxAttempts,
    rewardAmount: gameRewardAmount,
    codeMaster:
      lastTurnCount === null && playerPubKeyBase58
        ? playerPubKeyBase58
        : undefined,
    turnCount: receivedTurnCount,
    winnerPublicKeyBase58: winnerPublicKeyBase58
      ? winnerPublicKeyBase58
      : undefined,
    status: winnerPublicKeyBase58 ? GameStatus.ENDED : undefined,
  });

  const players = activePlayers.get(gameId) || new Set();
  players.forEach((player: WebSocket) => {
    if (player !== ws) {
      player.send(JSON.stringify({ zkProof, timestamp, game: updatedGame }));
    }
  });
};

export async function handleGameStart(
  gameId: string,
  activePlayers: Map<string, Set<WebSocket>>,
  ws: WebSocket,
  proofQueue: Queue
) {
  const game = await getGameById(gameId);
  if (!game?.codeBreaker) {
    const zkApp = new MastermindZkApp(PublicKey.fromBase58(gameId));
    const zkAppEvents = await zkApp.fetchEvents(UInt32.from(0));
    const acceptGameEvent = zkAppEvents.find((e) => e.type === 'gameAccepted');
    if (!acceptGameEvent) {
      throw new Error('Game has not been accepted!');
    }
    const acceptedGame = JSON.parse(JSON.stringify(acceptGameEvent.event.data));
    const response = await fetch(process.env.MINA_NETWORK_URL as string, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query {
            bestChain(maxLength: 1) {
              protocolState {
                consensusState {
                  slotSinceGenesis
                }
              }
            }
          }
        `,
      }),
    });
    const data = await response.json();
    const currentSlot =
      data.data?.bestChain?.[0]?.protocolState?.consensusState
        ?.slotSinceGenesis;
    const finalizeSlot = Number(acceptedGame.finalizeSlot);
    const startGameSlot = finalizeSlot - 2 * (game?.maxAttempts || 0);
    let status = GameStatus.IN_PROGRESS;
    let winnerPublicKeyBase58 = null;

    if (currentSlot - startGameSlot > 4) {
      await proofQueue.add('forfeitWin', {
        gameId,
        winnerPublicKeyBase58: game?.codeMaster,
      });
      status = GameStatus.PENALIZED;
      winnerPublicKeyBase58 = game?.codeMaster;
    }
    const updatedGame = await createOrUpdateGame({
      _id: gameId,
      codeBreaker: acceptedGame.codeBreakerPubKey,
      status,
      timestamp: Date.now(),
      winnerPublicKeyBase58: winnerPublicKeyBase58
        ? winnerPublicKeyBase58
        : undefined,
    });
    const players = activePlayers.get(gameId) || new Set();
    players.forEach((player: WebSocket) => {
      player.send(JSON.stringify({ game: updatedGame }));
    });
    return;
  }
  ws.send(JSON.stringify({ error: 'Game has already started!' }));
}
export async function handlePenalize(
  gameId: string,
  activePlayers: Map<string, Set<WebSocket>>,
  ws: WebSocket,
  proofQueue: Queue
) {
  const { isPenalized, game } = await checkForPenalization(gameId, proofQueue);
  if (isPenalized) {
    const players = activePlayers.get(gameId) || new Set();
    players.forEach((player: WebSocket) => {
      player.send(JSON.stringify({ game }));
    });
  } else {
    ws.send(
      JSON.stringify({ error: 'Player did not exceeded the allowed time!' })
    );
  }
}

async function checkForPenalization(gameId: string, proofQueue: Queue) {
  const now = Date.now();
  const game = await getGameById(gameId);
  const lastTurnTimestamp = game?.timestamp || Date.now();
  const TURN_DURATION = 1000 * 60 * 2;

  if (game?.turnCount && now - lastTurnTimestamp > TURN_DURATION) {
    const winnerPublicKeyBase58 =
      game?.turnCount % 2 === 0 ? game?.codeBreaker : game?.codeMaster;
    const updatedGame = await createOrUpdateGame({
      _id: gameId,
      status: GameStatus.PENALIZED,
      winnerPublicKeyBase58,
    });
    await proofQueue.add('forfeitWin', {
      gameId,
      winnerPublicKeyBase58,
    });
    return {
      isPenalized: true,
      game: updatedGame,
    };
  }
  return {
    isPenalized: false,
    game,
  };
}
