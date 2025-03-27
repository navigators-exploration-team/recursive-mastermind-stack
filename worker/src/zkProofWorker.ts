import { Worker } from 'bullmq';
import { Mina, PrivateKey, PublicKey } from 'o1js';
import { MastermindZkApp,StepProgramProof,StepProgram } from '@navigators-exploration-team/mina-mastermind'; 
import dotenv from 'dotenv';
dotenv.config();

const SERVER_PRIVATE_KEY = process.env.SERVER_PRIVATE_KEY as string;
const REDIS_PORT = parseInt(process.env.REDIS_PORT as string) || 6379
const REDIS_HOST = process.env.REDIS_HOST as string
const TRANSACTION_FEE = 1e8
const NETWORK_URL = process.env.MINA_NETWORK_URL || "http://host.docker.internal:8080/graphql";
console.log(SERVER_PRIVATE_KEY,REDIS_PORT,REDIS_HOST,NETWORK_URL)
const network = Mina.Network({ mina: NETWORK_URL });
Mina.setActiveInstance(network);

async function initialize() {
  console.time('compiling');
  await StepProgram.compile();
  await MastermindZkApp.compile();
  console.timeEnd('compiling');
}

initialize().catch((error) => {
  console.error('Initialization failed:', error);
});

const proofWorker = new Worker('proofQueue', async (job) => {

  try {  
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
  } catch (error) {
    console.error(`Failed to settle proof for game ${job.data.gameId} with error: `, error);
    throw error;
  }
}, {
  connection: {
    host: REDIS_HOST,
    port: REDIS_PORT,
  },lockDuration:300000
});

proofWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully.`);
});

proofWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});
 