import { Bool, fetchAccount, Mina, PublicKey } from 'o1js';
import dotenv from 'dotenv';
import {
  checkIfSolved,
  deserializeClue,
  MastermindZkApp,
  GameState,
  StepProgram,
  StepProgramProof,
} from '@navigators-exploration-team/mina-mastermind';
dotenv.config();

export const setupContract = async () => {
  const network = Mina.Network({
    mina: process.env.MINA_NETWORK_URL as string,
  });
  Mina.setActiveInstance(network);
  console.log('Compiling StepProgram...');
  console.time('StepProgram compilation');
  await StepProgram.compile();
  console.log('StepProgram compiled');
  console.timeEnd('StepProgram compilation');
  console.log('Compiling MastermindZkApp...');
  console.time('zkApp compilation');
  await MastermindZkApp.compile();
  console.log('MastermindZkApp compiled');
  console.timeEnd('zkApp compilation');
};

export async function checkGameStatus(
  gameId: string,
  zkProof: StepProgramProof
) {
  try {
    const zkAppPublicKey = PublicKey.fromBase58(gameId);
    let response = await fetchAccount({ publicKey: zkAppPublicKey });
    let accountExists = response.account !== undefined;
    if (accountExists) {
      const zkApp = new MastermindZkApp(zkAppPublicKey);
      let { maxAttempts } = GameState.unpack(await zkApp.compressedState.get());

      const turnCount = zkProof.publicOutput.turnCount.toString();
      const deserializedClue = deserializeClue(
        zkProof.publicOutput.serializedClue
      );
      const isGameSolved = checkIfSolved(deserializedClue) as Bool;

      return {
        maxAttempts: Number(maxAttempts.toString()),
        turnCount: Number(turnCount),
        isSolved: isGameSolved.toBoolean(),
      };
    }
  } catch (e) {
    console.log('error : ', e);
  }

  return {
    maxAttempts: null,
    turnCount: null,
    isSolved: null,
  };
}
