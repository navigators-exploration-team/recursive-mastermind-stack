import {
  Mina,
  fetchAccount,
  Field,
  AccountUpdate,
  UInt8,
  PublicKey,
  PrivateKey,
  Signature,
  Cache,
} from "o1js";
import {
  deserializeClue,
  MastermindZkApp,
  StepProgram,
  StepProgramProof,
} from "mina-mastermind";
import {
  createColoredClue,
  createColoredGuess,
  fetchZkAppCacheFiles,
  fetchZkProgramCacheFiles,
  MinaFileSystem,
} from "./utils";
import { SignedData } from "./store/zkAppModule";
type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;

interface VerificationKeyData {
  data: string;
  hash: Field;
}

const state = {
  MastermindContract: null as null | typeof MastermindZkApp,
  zkappInstance: null as null | MastermindZkApp,
  transaction: null as null | Transaction,
  verificationKey: null as null | VerificationKeyData | any,
  proofsEnabled: false,
  zkAppAddress: null as null | string,
  lastProof: null as null | StepProgramProof,
};

const functions = {
  setActiveInstanceToLightnet: async () => {
    const network = Mina.Network({
      mina: "http://localhost:8080/graphql",
      archive: "http://127.0.0.1:8282",
      lightnetAccountManager: "http://localhost:8181",
    });
    Mina.setActiveInstance(network);
  },
  loadContract: async (args: {}) => {
    const { MastermindZkApp } = await import("mina-mastermind");
    state.MastermindContract = MastermindZkApp;
  },
  compileContract: async (args: {}) => {
    try {
      const zkAppCacheFiles = await fetchZkAppCacheFiles();
      const zkProgramCacheFiles = await fetchZkProgramCacheFiles();
      const zkAppCache = MinaFileSystem(zkAppCacheFiles) as Cache;
      const zkProgramCache = MinaFileSystem(zkProgramCacheFiles) as Cache;
      console.time("compiling");
      await StepProgram.compile({ cache: zkProgramCache });
      const { verificationKey } = await state.MastermindContract!.compile({
        cache: zkAppCache,
      });
      console.timeEnd("compiling");
      state.verificationKey = verificationKey;
    } catch (e) {
      console.log("error: ", e);
    }
  },
  fetchAccount: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    return await fetchAccount({ publicKey });
  },
  proveTransaction: async () => {
    await state.transaction!.prove();
  },
  getTransactionJSON: async () => {
    return state.transaction!.toJSON();
  },
  createInitGameTransaction: async (args: {
    feePayer: string;
    rounds: number;
  }) => {
    let zkAppPrivateKey = PrivateKey.random();
    let zkAppAddress = zkAppPrivateKey.toPublicKey();

    state.zkappInstance = new state.MastermindContract!(zkAppAddress);
    const feePayerPublickKey = PublicKey.fromBase58(args.feePayer);
    const transaction = await Mina.transaction(feePayerPublickKey, async () => {
      AccountUpdate.fundNewAccount(feePayerPublickKey);
      state.zkappInstance!.deploy();
      await state.zkappInstance!.initGame(UInt8.from(args.rounds));
    });
    transaction.sign([zkAppPrivateKey]);
    state.transaction = transaction;
    state.zkAppAddress = zkAppAddress.toBase58();
    state.transaction!.send();
    return zkAppAddress.toBase58();
  },
  createNewGameTransaction: async (args: {
    feePayer: string;
    secretCombination: number;
    randomSalt: string;
  }) => {
    const feePayerPublickKey = PublicKey.fromBase58(args.feePayer);
    const transaction = await Mina.transaction(feePayerPublickKey, async () => {
      await state.zkappInstance!.createGame(
        Field(args.secretCombination),
        Field(args.randomSalt)
      );
    });
    state.transaction = transaction;
    state.transaction!.send();
  },
  sendNewGameProof: async (args: {
    signedData: SignedData;
    secretCombination: number;
    randomSalt: string;
    rounds: number;
  }) => {
    try {
      const signature = Signature.fromBase58(args.signedData.signature);
      const codeMasterPubKey = PublicKey.fromBase58(args.signedData.publicKey);
      const stepProof = await StepProgram.createGame(
        {
          authPubKey: codeMasterPubKey,
          authSignature: signature,
        },
        UInt8.from(args.rounds),
        Field(args.secretCombination),
        Field(args.randomSalt)
      );
      state.lastProof = stepProof.proof;
      return stepProof.proof.toJSON();
    } catch (e) {
      console.log(e);
    }
  },
  createGuessProof: async (args: {
    signedData: SignedData;
    unseparatedGuess: number;
  }) => {
    const signature = Signature.fromBase58(args.signedData.signature);
    const codeBreakerPubKey = PublicKey.fromBase58(args.signedData.publicKey);
    const stepProof = await StepProgram.makeGuess(
      {
        authPubKey: codeBreakerPubKey,
        authSignature: signature,
      },
      state.lastProof as StepProgramProof,
      Field(args.unseparatedGuess)
    );
    state.lastProof = stepProof.proof;
    return stepProof.proof.toJSON();
  },
  initZkappInstance: async (args: { publicKeyBase58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKeyBase58);
    await fetchAccount({ publicKey });
    state.zkappInstance = new state.MastermindContract!(publicKey);
    state.zkAppAddress = args.publicKeyBase58;
  },
  createGiveClueProof: async (args: {
    signedData: SignedData;
    secretCombination: number;
    randomSalt: string;
  }) => {
    const signature = Signature.fromBase58(args.signedData.signature);
    const codeMasterPubKey = PublicKey.fromBase58(args.signedData.publicKey);
    const stepProof = await StepProgram.giveClue(
      {
        authPubKey: codeMasterPubKey,
        authSignature: signature,
      },
      state.lastProof as StepProgramProof,
      Field(args.secretCombination),
      Field(args.randomSalt)
    );
    state.lastProof = stepProof.proof;
    return stepProof.proof.toJSON();
  },
  getZkappStates: async (args: {}) => {
    if (state.lastProof) {
      const {
        maxAttempts,
        turnCount,
        isSolved,
        solutionHash,
        lastGuess,
        serializedClue,
        codeBreakerId,
        codeMasterId,
      } = state.lastProof.publicOutput;
      const deserializedClue = deserializeClue(serializedClue);
      return {
        maxAttempts: maxAttempts.toNumber(),
        turnCount: turnCount.toNumber(),
        isSolved: isSolved.toString(),
        solutionHash: solutionHash.toString(),
        guessesHistory: createColoredGuess(JSON.stringify(lastGuess)),
        cluesHistory: createColoredClue(JSON.stringify(deserializedClue)),
        codebreakerId: codeBreakerId.toString(),
        codemasterId: codeMasterId.toString(),
      };
    }
    return null;
  },
  setLastProof: async (args: { zkProof: any }) => {
    state.lastProof = await StepProgramProof.fromJSON(JSON.parse(args.zkProof));
  },
  submitGameProof: async (args: {}) => {
    const transaction = await Mina.transaction(async () => {
      await state.zkappInstance!.submitGameProof(
        state.lastProof as StepProgramProof
      );
    });
    state.transaction = transaction;
    state.transaction!.send();
  },
};

// ---------------------------------------------------------------------------------------

export type WorkerFunctions = keyof typeof functions;

export type ZkappWorkerRequest = {
  id: number;
  fn: WorkerFunctions;
  args: any;
};

export type ZkappWorkerReponse = {
  id: number;
  data: any;
};

addEventListener("message", async (event: MessageEvent<ZkappWorkerRequest>) => {
  try {
    const returnData = await functions[event.data.fn](event.data.args);
    postMessage({
      id: event.data.id,
      data: returnData,
    });
  } catch (error) {
    postMessage({
      id: event.data.id,
      data: null,
      error:
        error instanceof Error
          ? error.message.substring(0, error.message.indexOf("!"))
          : "Unknown error",
    });
  }
});
