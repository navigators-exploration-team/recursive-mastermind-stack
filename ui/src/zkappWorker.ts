import {
  Mina,
  PublicKey,
  fetchAccount,
  Field,
  AccountUpdate,
  PrivateKey,
  UInt8,
} from "o1js";
import {
  deserializeClueHistory,
  deserializeCombinationHistory,
  MastermindZkApp,
} from "mina-mastermind";
import {
  createCluesMatrix,
  createGuessesMatrix,
  transformBinaryArray,
} from "./utils";
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
    const { verificationKey } = await state.MastermindContract!.compile();
    state.verificationKey = verificationKey;
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
      serializedGuessHistory,
      packedClueHistory,
    ] = await Promise.all([
      state.zkappInstance!.maxAttempts.get(),
      state.zkappInstance!.turnCount.get(),
      state.zkappInstance!.isSolved.get(),
      state.zkappInstance!.solutionHash.get(),
      state.zkappInstance!.packedGuessHistory.get(),
      state.zkappInstance!.packedClueHistory.get(),
    ]);

    const guessHistory = JSON.stringify(
      deserializeCombinationHistory(serializedGuessHistory)
    );
    const clueHistory = JSON.stringify(
      deserializeClueHistory(packedClueHistory)
    );
    const clues = transformBinaryArray(JSON.parse(clueHistory));
    return {
      maxAttempts: maxAttempts.toNumber(),
      turnCount: turnCount.toNumber(),
      isSolved: isSolved.toString(),
      solutionHash,
      guessesHistory: createGuessesMatrix(guessHistory),
      cluesHistory: createCluesMatrix(clues, turnCount.toNumber()),
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
  const returnData = await functions[event.data.fn](event.data.args);

  const message: ZkappWorkerReponse = {
    id: event.data.id,
    data: returnData,
  };
  postMessage(message);
});
