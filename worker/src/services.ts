import { Job } from 'bullmq';
import { fetchAccount, Mina, PrivateKey, PublicKey } from 'o1js';
import {
  MastermindZkApp,
  StepProgramProof,
} from '@navigators-exploration-team/mina-mastermind';
import dotenv from 'dotenv';
import {
  createOrUpdateGame,
  getPendingGames,
  updateManyGames,
} from './repositories/game.js';

dotenv.config();

const SERVER_PRIVATE_KEY = process.env.SERVER_PRIVATE_KEY as string;
const TRANSACTION_FEE = 1e8;
dotenv.config();

export const sendFinalProof = async (job: Job) => {
  const { gameId, zkProof, winnerPublicKeyBase58 } = job.data;
  const senderPrivateKey = PrivateKey.fromBase58(SERVER_PRIVATE_KEY);
  const senderPublicKey = senderPrivateKey.toPublicKey();
  const winnerPublicKey = PublicKey.fromBase58(winnerPublicKeyBase58);
  const zkApp = new MastermindZkApp(PublicKey.fromBase58(gameId));
  console.log('creating transaction...');
  const proof = await StepProgramProof.fromJSON(JSON.parse(zkProof));
  const transaction = await Mina.transaction(
    {
      sender: senderPublicKey,
      fee: TRANSACTION_FEE,
    },
    async () => {
      await zkApp.submitGameProof(proof, winnerPublicKey);
    }
  );
  console.log('proving transaction...');
  await transaction.prove();
  transaction.sign([senderPrivateKey]);
  console.log('sending transaction...');
  const pendingTx = await transaction.send();
  console.log('Transaction sent: ', pendingTx.hash);
  const txHash = pendingTx.hash;
  const game = await createOrUpdateGame({
    _id: gameId,
    settlementTransactionHash: txHash,
  });
  console.log(
    `Proof submitted for game ${gameId}, transaction hash: ${txHash}`
  );
  return game;
};

export const checkGameCreation = async () => {
  let pendingGames: { _id: string }[] = [];
  let activeGames: string[] = [];
  try {
    pendingGames = await getPendingGames();
  } catch (error) {
    console.error('Error fetching games: ', error);
  }
  const promises = pendingGames.map(async (game) => {
    try {
      const zkAppPublicKey = PublicKey.fromBase58(game._id);
      let response = await fetchAccount({ publicKey: zkAppPublicKey });
      if (response.account !== undefined) {
        activeGames.push(game._id);
      }
    } catch (err) {
      console.error(`Error on game ${game._id}: `, err);
    }
  });
  await Promise.all(promises);
  if (activeGames.length) {
    await updateManyGames(activeGames);
  }
};

export const forfeitWin = async (job: Job) => {
  const { gameId, winnerPublicKeyBase58 } = job.data;
  const senderPrivateKey = PrivateKey.fromBase58(SERVER_PRIVATE_KEY);
  const senderPublicKey = senderPrivateKey.toPublicKey();
  const winnerPublicKey = PublicKey.fromBase58(winnerPublicKeyBase58);
  const zkApp = new MastermindZkApp(PublicKey.fromBase58(gameId));
  console.log('creating transaction...');
  const transaction = await Mina.transaction(
    {
      sender: senderPublicKey,
      fee: TRANSACTION_FEE,
    },
    async () => {
      await zkApp.forfeitWin(winnerPublicKey);
    }
  );
  console.log('proving transaction...');
  await transaction.prove();
  transaction.sign([senderPrivateKey]);
  console.log('sending transaction...');
  const pendingTx = await transaction.send();
  console.log('Transaction sent: ', pendingTx.hash);
  const txHash = pendingTx.hash;
  const game = await createOrUpdateGame({
    _id: gameId,
    penalizationTransactionHash: txHash,
  });
  return game;
};
