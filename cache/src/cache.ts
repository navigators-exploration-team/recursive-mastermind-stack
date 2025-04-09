import { Cache } from 'o1js';
import {
  MastermindZkApp,
  StepProgram,
} from '@navigators-exploration-team/mina-mastermind';

const cacheZkApp = async () => {
  const zkAppCache: Cache = Cache.FileSystem('./zkAppCache');
  const zkProgramCache: Cache = Cache.FileSystem('./zkProgramCache');
  await StepProgram.compile({ cache: zkProgramCache });
  await MastermindZkApp.compile({ cache: zkAppCache });
};

cacheZkApp();
