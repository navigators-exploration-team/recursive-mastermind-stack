import { Job } from 'bullmq';
import { fetchAccount, Mina, PrivateKey, PublicKey } from 'o1js';
import {
  MastermindZkApp,
  StepProgramProof,
} from '@navigators-exploration-team/mina-mastermind';
import dotenv from 'dotenv';
import { deleteGame, getGame, saveGame } from './kvStorageSevice.js';

dotenv.config();

const SERVER_PRIVATE_KEY = process.env.SERVER_PRIVATE_KEY as string;
const TRANSACTION_FEE = 1e8;
dotenv.config();

const CLOUDFLARE_WORKER_URL = process.env.CLOUDFLARE_WORKER_URL;

export const sendFinalProof = async (job: Job) => {
  const { gameId, zkProof } = job.data;
  const senderPrivateKey = PrivateKey.fromBase58(SERVER_PRIVATE_KEY);
  const senderPublicKey = senderPrivateKey.toPublicKey();
  const zkApp = new MastermindZkApp(PublicKey.fromBase58(gameId));
  console.log('creating transaction...');
  const proof = await StepProgramProof.fromJSON(JSON.parse(zkProof));
  const transaction = await Mina.transaction(
    {
      sender: senderPublicKey,
      fee: TRANSACTION_FEE,
    },
    async () => {
      // Todo - pass correct pubkey
      await zkApp.submitGameProof(proof, PublicKey.empty());
    }
  );
  console.log('proving transaction...');
  await transaction.prove();
  transaction.sign([senderPrivateKey]);
  console.log('sending transaction...');
  const pendingTx = await transaction.send();
  console.log('Transaction sent: ', pendingTx.hash);
  const txHash = pendingTx.hash;
  console.log(
    `Proof submitted for game ${gameId}, transaction hash: ${txHash}`
  );
  return txHash;
};

export const checkGameCreation = async () => {
  let cursor = null;
  let allGames: string[] = [];
  const limit = 1000;
  let list_complete = false;
  do {
    try {
      const seachParams: string = cursor
        ? `limit=${limit.toString()}&cursor=${cursor}`
        : `limit=${limit.toString()}`;

      const response = await fetch(
        `${CLOUDFLARE_WORKER_URL}/pending-games?${seachParams}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch games');

      const data = await response.json();
      allGames = allGames.concat(
        data.games.map((e: { name: string }) => e.name)
      );
      cursor = data.cursor;
      list_complete = data.list_complete;
    } catch (error) {
      console.error('Error fetching games: ', error);
      break;
    }
  } while (!list_complete);
  let promises = allGames.map(async (game) => {
    try {
      const zkAppPublicKey = PublicKey.fromBase58(game.replace('PENDING_', ''));
      let response = await fetchAccount({ publicKey: zkAppPublicKey });

      if (response.account !== undefined) {
        const gameData = await getGame(game);
        await saveGame(
          game.replace('PENDING_', ''),
          JSON.parse(gameData?.value)
        );
        await deleteGame(game);
      }
    } catch (err) {
      console.error(`Error on game ${game}: `, err);
    }
  });
  await Promise.all(promises);
};
