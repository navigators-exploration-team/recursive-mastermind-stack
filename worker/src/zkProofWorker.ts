import { Worker, Job } from 'bullmq';
import { Mina } from 'o1js';
import {
  MastermindZkApp,
  StepProgram,
} from '@navigators-exploration-team/mina-mastermind';
import dotenv from 'dotenv';
import { checkGameCreation, sendFinalProof } from './services.js';
dotenv.config();

const REDIS_PORT = parseInt(process.env.REDIS_PORT as string) || 6379;
const REDIS_HOST = process.env.REDIS_HOST as string;
const NETWORK_URL =
  process.env.MINA_NETWORK_URL || 'http://host.docker.internal:8080/graphql';
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

const proofWorker = new Worker(
  'proofQueue',
  async (job: Job) => {
    try {
      if (job.name === 'checkGameCreation') {
        await checkGameCreation();
      } else if (job.name === 'sendFinalProof') {
        return await sendFinalProof(job);
      }
    } catch (error) {
      console.error(`job failed with error: `, error);
      throw error;
    }
  },
  {
    connection: {
      host: REDIS_HOST,
      port: REDIS_PORT,
    },
    lockDuration: 300000,
  }
);

proofWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully.`);
});

proofWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});
