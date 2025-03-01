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
  lastProof: StepProgramProof,
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
      await StepProgram.compile();
      const { verificationKey } = await state.MastermindContract!.compile({
       // cache: zkAppCache,
      });
      console.timeEnd("compiling");
      state.verificationKey = verificationKey;
    } catch (e) {
      console.log("e ", e);
    }
  },
  fetchAccount: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    return await fetchAccount({ publicKey }, "http://localhost:8080/graphql");
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
    secretCombination: number[];
    randomSalt: string;
  }) => {
    const combination = args.secretCombination.reduce(
      (acc: number, curr: number) => {
        return acc * 10 + curr;
      },
      0
    );
    const feePayerPublickKey = PublicKey.fromBase58(args.feePayer);

    const transaction = await Mina.transaction(feePayerPublickKey, async () => {
      await state.zkappInstance!.createGame(
        Field(combination),
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
    const codeMasterPubKey = PublicKey.fromBase58(args.signedData.publicKey);

    const stepProof = await StepProgram.createGame(
      {
        authPubKey: codeMasterPubKey,
        authSignature: Signature.fromJSON(args.signedData.signature),
      },
      UInt8.from(args.rounds),
      Field(args.secretCombination),
      Field(args.randomSalt)
    );

    state.lastProof = stepProof.proof;
  },
  createGuessTransaction: async (args: {
    feePayer: string;
    secretCombination: number[];
  }) => {
    const combination = args.secretCombination.reduce(
      (acc: number, curr: number) => {
        return acc * 10 + curr;
      },
      0
    );
    const feePayerPublickKey = PublicKey.fromBase58(args.feePayer);

    state.transaction = await Mina.transaction(feePayerPublickKey, async () => {
      await state.zkappInstance!.makeGuess(Field(combination));
    });
    state.transaction!.send();
  },
  initZkappInstance: async (args: { publicKeyBase58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKeyBase58);
    await fetchAccount({ publicKey });
    state.zkappInstance = new state.MastermindContract!(publicKey);
    state.zkAppAddress = args.publicKeyBase58;
  },
  createGiveClueTransaction: async (args: {
    feePayer: string;
    secretCombination: number[];
    randomSalt: string;
  }) => {
    const combination = args.secretCombination.reduce(
      (acc: number, curr: number) => {
        return acc * 10 + curr;
      },
      0
    );
    const feePayerPublickKey = PublicKey.fromBase58(args.feePayer);
    const transaction = await Mina.transaction(feePayerPublickKey, async () => {
      await state.zkappInstance!.giveClue(
        Field(combination),
        Field(args.randomSalt)
      );
    });
    state.transaction = transaction;
    state.transaction!.send();
  },
  getZkappStates: async (args: {}) => {
    const publicKey = PublicKey.fromBase58(state.zkAppAddress as string);
    await fetchAccount({ publicKey });
    const [
      maxAttempts,
      turnCount,
      isSolved,
      solutionHash,
      unseparatedGuess,
      serializedClue,
      codebreakerId,
      codemasterId,
    ] = await Promise.all([
      state.zkappInstance!.maxAttempts.get(),
      state.zkappInstance!.turnCount.get(),
      state.zkappInstance!.isSolved.get(),
      state.zkappInstance!.solutionHash.get(),
      state.zkappInstance!.unseparatedGuess.get(),
      state.zkappInstance!.serializedClue.get(),
      state.zkappInstance!.codebreakerId.get(),
      state.zkappInstance!.codemasterId.get(),
    ]);

    const deserializedClue = deserializeClue(serializedClue);
    return {
      maxAttempts: maxAttempts.toNumber(),
      turnCount: turnCount.toNumber(),
      isSolved: isSolved.toString(),
      solutionHash: solutionHash.toString(),
      guessesHistory: [createColoredGuess(JSON.stringify(unseparatedGuess))],
      cluesHistory: [createColoredClue(JSON.stringify(deserializedClue))],
      codebreakerId: codebreakerId.toString(),
      codemasterId: codemasterId.toString(),
    };
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
