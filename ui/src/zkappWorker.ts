import {
  Mina,
  fetchAccount,
  Field,
  AccountUpdate,
  PublicKey,
  PrivateKey,
  Signature,
  Cache,
  UInt64,
  Poseidon,
  UInt8,
} from 'o1js';
import {
  GameState,
  MastermindZkApp,
  StepProgram,
  StepProgramProof,
} from '@navigators-exploration-team/mina-mastermind';
import {
  fetchZkAppCacheFiles,
  fetchZkProgramCacheFiles,
  generateColoredCluesHistory,
  generateColoredGuessHistory,
  MinaFileSystem,
} from './utils';
import { SignedData } from './store/zkAppModule';
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
      mina: import.meta.env.VITE_MINA_NETWORK_URL,
    });
    Mina.setActiveInstance(network);
  },
  loadContract: async () => {
    const { MastermindZkApp } = await import(
      '@navigators-exploration-team/mina-mastermind'
    );
    state.MastermindContract = MastermindZkApp;
  },
  compileContract: async () => {
    try {
      const zkAppCacheFiles = await fetchZkAppCacheFiles();
      const zkProgramCacheFiles = await fetchZkProgramCacheFiles();
      const zkAppCache = MinaFileSystem(zkAppCacheFiles) as Cache;
      const zkProgramCache = MinaFileSystem(zkProgramCacheFiles) as Cache;
      console.time('compiling');
      await StepProgram.compile({ cache: zkProgramCache });
      const { verificationKey } = await state.MastermindContract!.compile({
        cache: zkAppCache,
      });
      console.timeEnd('compiling');
      state.verificationKey = verificationKey;
    } catch (e) {
      console.log('error: ', e);
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
    unseparatedSecretCombination: number;
    salt: string;
    maxAttempts: number;
    refereePubKeyBase58: string;
    rewardAmount: number;
  }) => {
    let zkAppPrivateKey = PrivateKey.random();
    let zkAppAddress = zkAppPrivateKey.toPublicKey();
    state.zkappInstance = new state.MastermindContract!(zkAppAddress);
    const feePayerPublickKey = PublicKey.fromBase58(args.feePayer);
    const refereePubKey = PublicKey.fromBase58(args.refereePubKeyBase58);
    const transaction = await Mina.transaction(feePayerPublickKey, async () => {
      AccountUpdate.fundNewAccount(feePayerPublickKey);
      state.zkappInstance!.deploy();
      await state.zkappInstance!.initGame(
        Field(args.unseparatedSecretCombination),
        Field(args.salt),
        UInt8.from(args.maxAttempts),
        refereePubKey,
        UInt64.from(args.rewardAmount)
      );
    });
    transaction.sign([zkAppPrivateKey]);
    state.transaction = transaction;
    state.zkAppAddress = zkAppAddress.toBase58();
    return zkAppAddress.toBase58();
  },
  sendNewGameProof: async (args: {
    signedData: SignedData;
    unseparatedSecretCombination: number;
    salt: string;
  }) => {
    try {
      const signature = Signature.fromBase58(args.signedData.signature);
      const codeMasterPubKey = PublicKey.fromBase58(args.signedData.publicKey);
      const stepProof = await StepProgram.createGame(
        {
          authPubKey: codeMasterPubKey,
          authSignature: signature,
        },
        Field(args.unseparatedSecretCombination),
        Field(args.salt)
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
  createAcceptGameTransaction: async (args: { feePayer: string }) => {
    const feePayerPublickKey = PublicKey.fromBase58(args.feePayer);
    const transaction = await Mina.transaction(feePayerPublickKey, async () => {
      await state.zkappInstance!.acceptGame();
    });
    state.transaction = transaction;
  },
  getZkAppStates: async () => {
    const publicKey = PublicKey.fromBase58(state.zkAppAddress as string);
    await fetchAccount({ publicKey });
    const [codeMasterId, codeBreakerId, compressedState] = await Promise.all([
      state.zkappInstance!.codeMasterId.get(),
      state.zkappInstance!.codeBreakerId.get(),
      state.zkappInstance!.compressedState.get(),
    ]);
    let { rewardAmount, finalizeSlot, turnCount, maxAttempts, isSolved } =
      GameState.unpack(compressedState);

    return {
      rewardAmount: rewardAmount.toString(),
      finalizeSlot: finalizeSlot.toString(),
      codeBreakerId: codeBreakerId.toString(),
      codeMasterId: codeMasterId.toString(),
      turnCount: turnCount.toString(),
      maxAttempts: maxAttempts.toString(),
      isSolved: isSolved.toString(),
    };
  },
  getZkProofStates: async () => {
    if (state.lastProof) {
      const {
        codeMasterId,
        codeBreakerId,
        solutionHash,
        turnCount,
        packedGuessHistory,
        packedClueHistory,
      } = state.lastProof.publicOutput;

      return {
        guessesHistory: generateColoredGuessHistory(packedGuessHistory),
        solutionHash: solutionHash.toString(),
        codeBreakerId: codeBreakerId.toString(),
        codeMasterId: codeMasterId.toString(),
        turnCount: Number(turnCount.toString()),
        cluesHistory: generateColoredCluesHistory(
          packedClueHistory,
          Number(turnCount.toString())
        ),
      };
    }
    return null;
  },
  getUserRole: async (args: { playerPubKeyBase58: string }) => {
    const publicKey = PublicKey.fromBase58(args.playerPubKeyBase58 as string);
    await fetchAccount({ publicKey });
    const playerId = Poseidon.hash(publicKey.toFields());
    const [codeMasterId, codeBreakerId] = await Promise.all([
      state.zkappInstance!.codeMasterId.get(),
      state.zkappInstance!.codeBreakerId.get(),
    ]);

    return playerId.toString() === codeMasterId.toString()
      ? 'CODE_MASTER'
      : playerId.toString() === codeBreakerId.toString()
        ? 'CODE_BREAKER'
        : 'UNKNOWN';
  },
  setLastProof: async (args: { zkProof: any }) => {
    state.lastProof = await StepProgramProof.fromJSON(JSON.parse(args.zkProof));
  },
  submitGameProof: async () => {
    const transaction = await Mina.transaction(async () => {
      await state.zkappInstance!.submitGameProof(
        state.lastProof as StepProgramProof,
        //Todo: add corect pubkey
        PublicKey.empty()
      );
    });
    state.transaction = transaction;
  },
  createClaimRewardTransaction: async (args: { feePayer: string }) => {
    const feePayerPublickKey = PublicKey.fromBase58(args.feePayer);
    const transaction = await Mina.transaction(feePayerPublickKey, async () => {
      await state.zkappInstance!.claimReward();
    });
    state.transaction = transaction;
  },
  hasEnoughFunds: async (args: { publicKey: string; rewardAmount: number }) => {
    const res = await functions.fetchAccount({ publicKey58: args.publicKey });
    if (res.account) {
      return Number(res.account.balance.toString()) > args.rewardAmount;
    }
    return false;
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

addEventListener('message', async (event: MessageEvent<ZkappWorkerRequest>) => {
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
          ? error.message.substring(0, error.message.indexOf('!'))
          : 'Unknown error',
    });
  }
});
