import { fetchAccount, Mina, PrivateKey, PublicKey } from "o1js";
import dotenv from "dotenv";
import {
  checkIfSolved,
  deserializeClue,
  MastermindZkApp,
  separateTurnCountAndMaxAttemptSolved,
  StepProgram,
  StepProgramProof,
} from "mina-mastermind-recursive";
dotenv.config();

export const setupContract = async () => {
  const network = Mina.Network({
    mina: process.env.MINA_NETWORK_URL as string,
  }); 
  Mina.setActiveInstance(network);
  console.time("compiling");
  await StepProgram.compile();
  await MastermindZkApp.compile();
  console.timeEnd("compiling");
};
export async function checkGameProgress(
  gameId: string,
  zkProof: StepProgramProof
) {
  try {
    const zkAppPublicKey = PublicKey.fromBase58(gameId);
    let response = await fetchAccount({ publicKey: zkAppPublicKey });
    let accountExists = response.account !== undefined;
    if (accountExists) {
      const zkApp = new MastermindZkApp(zkAppPublicKey);
      const turnCountMaxAttemptsIsSolved =
        await zkApp.turnCountMaxAttemptsIsSolved.get();

      const [_, maxAttempts, isSolved] = separateTurnCountAndMaxAttemptSolved(
        turnCountMaxAttemptsIsSolved
      );
      const turnCount = zkProof.publicOutput.turnCount.toString();
      const deserializedClue = deserializeClue(
        zkProof.publicOutput.serializedClue
      );
      const isGameSolved = checkIfSolved(deserializedClue);
      if (
        Number(maxAttempts.toString()) * 2 < Number(turnCount) ||
        isGameSolved.toString() === "true"
      ) {
        const senderPrivateKey = PrivateKey.fromBase58(
          process.env.SERVER_PRIVATE_KEY as string
        );
        const senderPublicKey = senderPrivateKey.toPublicKey();

        const transaction = await Mina.transaction(
          {
            sender: senderPublicKey,
            fee: 1e8,
          },
          async () => {
            await zkApp.submitGameProof(zkProof);
          }
        );
        console.log("transaction... ")
        await transaction.prove();
        transaction.sign([senderPrivateKey]);
        const pendingTx = await transaction.send();

        console.log("Transaction sent: ", pendingTx.hash);
      }
    }
  } catch (e) {
    console.log("error : ", e);
  }
}
