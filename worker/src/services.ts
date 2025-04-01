import { Job } from 'bullmq';
import { fetchAccount, Mina, PrivateKey, PublicKey } from 'o1js';
import { MastermindZkApp,StepProgramProof } from '@navigators-exploration-team/mina-mastermind'; 
import dotenv from 'dotenv';

dotenv.config();

const SERVER_PRIVATE_KEY = process.env.SERVER_PRIVATE_KEY as string;
const TRANSACTION_FEE = 1e8

export const sendFinalProof = async (job:Job) => {
    
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
        await zkApp.submitGameProof(proof);
      }
    );
    console.log('proving transaction...');
    await transaction.prove();
    transaction.sign([senderPrivateKey]);
    console.log('sending transaction...');
    const pendingTx = await transaction.send();
    console.log('Transaction sent: ', pendingTx.hash);
    const txHash =  pendingTx.hash; 
    console.log(`Proof submitted for game ${gameId}, transaction hash: ${txHash}`);
    return txHash;

}

export const checkGameCreation = async (job:Job) => {
  // get the list of keys that start with _
  const {gameId} = job.data
  // apply fetchAccount
  const zkAppPublicKey = PublicKey.fromBase58(gameId);
  let response = await fetchAccount({ publicKey: zkAppPublicKey });
  // if exist then update key by creating a new game without the _ and delete the old key
  

}