import { defineStore } from 'pinia';
import ZkappWorkerClient from '../zkappWorkerClient';
import { serializeSecret } from '../utils';
import { WebSocketService } from '../services/websocket';
import axios from 'axios';

export interface SignedData {
  publicKey: string;
  data: string;
  signature: string;
}

interface ProviderError extends Error {
  message: string;
  code: number;
  data?: unknown;
}
interface MinaWallet {
  requestAccounts: () => Promise<string[]>;
  signFields: (args: {
    message: Array<string | number>;
  }) => Promise<SignedData | ProviderError>;
  on: (event: string, handler: Function) => void;
}

declare global {
  interface Window {
    mina?: MinaWallet;
  }
}
const SERVER_URL = import.meta.env.VITE_SERVER_URL;
export const useZkAppStore = defineStore('useZkAppModule', {
  state: () => ({
    zkappWorkerClient: null as null | ZkappWorkerClient,
    hasWallet: null as null | boolean,
    stepDisplay: '' as string,
    hasBeenSetup: false,
    accountExists: false,
    publicKeyBase58: null as null | any,
    requestedConnexion: false,
    error: null as Object | any,
    loading: false,
    currentTransactionLink: '',
    zkAppStates: null as null | any,
    zkProofStates: null as null | any,
    compiled: false,
    zkAppAddress: null as null | string,
    webSocketInstance: null as null | WebSocketService,
    userRole: null as null | string,
    lastTransactionLink: null as null | string,
  }),
  getters: {},
  actions: {
    async setupZkApp() {
      if (window.mina) {
        try {
          this.requestedConnexion = true;
          this.stepDisplay = 'Loading web worker...';
          this.zkappWorkerClient = new ZkappWorkerClient();
          await new Promise((resolve) => setTimeout(resolve, 500));
          this.stepDisplay = 'Setting Mina instance...';
          await this.zkappWorkerClient.setActiveInstanceToLightnet();
          const accounts = await window.mina.requestAccounts();
          this.publicKeyBase58 = accounts[0];
          this.stepDisplay = 'Checking if fee payer account exists...';
          const res = await this.zkappWorkerClient.fetchAccount(
            this.publicKeyBase58
          );
          this.accountExists = res.error === null;
          await this.zkappWorkerClient.loadContract();
          this.stepDisplay = 'Compiling zkApp...';

          await this.zkappWorkerClient.compileContract();
          this.stepDisplay = '';
          this.compiled = true;
          this.hasBeenSetup = true;
          this.hasWallet = true;
          window.mina?.on('accountsChanged', async (accounts: string[]) => {
            if (accounts.length) {
              this.publicKeyBase58 = accounts[0];
            } else {
              const newAccounts = await window.mina?.requestAccounts();
              this.publicKeyBase58 = newAccounts?.[0];
            }
            await this.getRole();
          });
          console.log('setup completed...');
          this.error = null;
        } catch (error: any) {
          return { message: error.message };
        }
      } else {
        this.hasWallet = false;
        this.stepDisplay = 'Mina Wallet not detected';

        this.error = {
          message: 'Mina Wallet not detected. Please install Auro Wallet.',
        };
        return;
      }
    },
    async checkAccountExists() {
      try {
        for (;;) {
          const res = await this.zkappWorkerClient!.fetchAccount(
            this.publicKeyBase58
          );
          const accountExists = res.error == null;
          if (accountExists) {
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      } catch (error: any) {
        this.stepDisplay = `Error checking account: ${error.message}`;
      }
      this.accountExists = true;
      this.error = null;
    },
    async joinGame(gameId?: string) {
      // @ts-ignore
      this.webSocketInstance = new WebSocketService(
        gameId ?? (this.zkAppAddress as string)
      );
      this.webSocketInstance!.setCallback(async (data: any) => {
        await this.setLastProof(data.zkProof);
        await this.getZkAppStates();
        await this.getZkProofStates();
      });
    },
    async signFields(content: object): Promise<SignedData> {
      try {
        this.stepDisplay = 'Signing...';

        const signedData = await (window as any).mina.signFields({
          message: content,
        });

        this.stepDisplay = '';
        return signedData;
      } catch (err: any) {
        console.log('error ', err);
        throw new Error(err?.message || 'Signing failed');
      }
    },
    async createInitGameTransaction(
      separatedSecretCombination: number[],
      salt: string,
      maxAttempts: number,
      refereePubKeyBase58: string,
      rewardAmount: number
    ) {
      try {
        this.loading = true;
        const hasEnoughFunds = await this.zkappWorkerClient?.hasEnoughFunds(
          this.publicKeyBase58,
          rewardAmount
        );
        if (!hasEnoughFunds) {
          throw new Error("You don't have enough funds!");
        }
        this.stepDisplay = 'Creating a transaction...';
        const combination = serializeSecret(separatedSecretCombination);
        const signedData = await this.signFields([combination, salt]);

        this.zkAppAddress =
          await this.zkappWorkerClient!.createInitGameTransaction(
            this.publicKeyBase58,
            combination,
            salt,
            maxAttempts,
            refereePubKeyBase58,
            rewardAmount
          );

        this.stepDisplay = 'Generating proof...';
        await this.zkappWorkerClient!.proveTransaction();

        this.stepDisplay = 'Getting transaction JSON...';
        const transactionJSON =
          await this.zkappWorkerClient!.getTransactionJSON();

        this.stepDisplay = 'Requesting send transaction...';
        const { hash } = await (window as any).mina.sendTransaction({
          transaction: transactionJSON,
          feePayer: {
            memo: '',
          },
        });
        this.currentTransactionLink = hash;
        await this.joinGame();
        const res = await this.zkappWorkerClient!.sendNewGameProof(
          signedData,
          combination,
          salt
        );
        this.webSocketInstance?.send({
          action: 'sendProof',
          gameId: this.zkAppAddress,
          zkProof: JSON.stringify(res),
          maxAttempts,
          rewardAmount
        });
        await axios.post(SERVER_URL + `/games/${this.publicKeyBase58}`, {
          gameId: this.zkAppAddress,
        });
        this.stepDisplay = '';
        this.error = null;
      } catch (err: any) {
        this.error = err?.message || err;
        console.log('error ', err);
        return null;
      } finally {
        this.loading = false;
      }
      return this.zkAppAddress;
    },
    async createGuessProof(code: number[]) {
      try {
        this.loading = true;
        this.stepDisplay = 'Creating signature...';
        const combination = serializeSecret(code);
        const signedData = await this.signFields([
          combination,
          this.zkProofStates.turnCount,
        ]);
        if (signedData) {
          this.stepDisplay = 'Generating proof...';
          const res = await this.zkappWorkerClient!.createGuessProof(
            signedData,
            combination
          );
          this.stepDisplay = 'Sending proof...';
          this.webSocketInstance?.send({
            action: 'sendProof',
            gameId: this.zkAppAddress,
            zkProof: JSON.stringify(res),
          });
          await this.getZkProofStates();
        }

        this.error = null;
      } catch (err: any) {
        this.error = err?.message || err;
        console.log('error ', err);
      } finally {
        this.loading = false;
        this.stepDisplay = '';
        return this.zkAppAddress;
      }
    },
    async createGiveClueProof(code: number[], randomSalt: string) {
      try {
        this.loading = true;
        this.stepDisplay = 'Creating signature...';
        const combination = serializeSecret(code);
        const signedData = await this.signFields([
          combination,
          randomSalt,
          this.zkProofStates.turnCount,
        ]);
        if (signedData) {
          this.stepDisplay = 'Generating proof...';
          const res = await this.zkappWorkerClient!.createGiveClueProof(
            signedData,
            combination,
            randomSalt
          );
          this.stepDisplay = 'Sending proof...';
          this.webSocketInstance?.send({
            action: 'sendProof',
            gameId: this.zkAppAddress,
            zkProof: JSON.stringify(res),
          });
          await this.getZkProofStates();
        }
        this.error = null;
      } catch (err: any) {
        this.error = err?.message || err;
        console.log('error ', err);
      } finally {
        this.stepDisplay = '';
        this.loading = false;
        return this.zkAppAddress;
      }
    },
    async submitGameProof() {
      try {
        this.loading = true;
        this.stepDisplay = 'Creating a transaction...';
        await this.zkappWorkerClient!.submitGameProof();
        this.stepDisplay = 'Generating proof...';
        await this.zkappWorkerClient!.proveTransaction();
        this.stepDisplay = 'Getting transaction JSON...';
        const transactionJSON =
          await this.zkappWorkerClient!.getTransactionJSON();
        this.stepDisplay = 'Requesting send transaction...';
        const { hash } = await (window as any).mina.sendTransaction({
          transaction: transactionJSON,
          feePayer: {
            memo: '',
          },
        });
        this.currentTransactionLink = hash;
        this.stepDisplay = '';
        this.error = null;
      } catch (err: any) {
        this.error = err?.message || err;
        console.log('error ', err);
      } finally {
        this.loading = false;
      }
    },
    async initZkappInstance(zkAppAddress: string) {
      await this.zkappWorkerClient!.initZkappInstance(zkAppAddress);
      this.zkAppAddress = zkAppAddress;
    },
    async getZkAppStates() {
      try {
        console.log('fetching zkApp states ...');
        this.zkAppStates = await this.zkappWorkerClient!.getZkAppStates();
        this.error = null;
      } catch (err: any) {
        this.error = err.message;
      }
    },
    async getZkProofStates() {
      try {
        this.zkProofStates = await this.zkappWorkerClient!.getZkProofStates();
        this.error = null;
      } catch (err: any) {
        this.error = err.message;
      }
    },
    async setLastProof(zkProof: any) {
      await this.zkappWorkerClient!.setLastProof(zkProof);
    },
    async acceptGame() {
      try {
        this.loading = true;
        const hasEnoughFunds = await this.zkappWorkerClient?.hasEnoughFunds(
          this.publicKeyBase58,
          this.zkAppStates.rewardAmount
        );
        if (!hasEnoughFunds) {
          throw new Error("You don't have enough funds!");
        }
        this.stepDisplay = 'Creating a transaction...';
        await this.zkappWorkerClient!.createAcceptGameTransaction(
          this.publicKeyBase58
        );
        this.stepDisplay = 'Generating proof...';
        await this.zkappWorkerClient!.proveTransaction();
        this.stepDisplay = 'Getting transaction JSON...';
        const transactionJSON =
          await this.zkappWorkerClient!.getTransactionJSON();
        this.stepDisplay = 'Requesting send transaction...';
        const { hash } = await (window as any).mina.sendTransaction({
          transaction: transactionJSON,
          feePayer: {
            memo: '',
          },
        });
        this.currentTransactionLink = hash;
        await this.joinGame();
        this.stepDisplay = '';
        this.error = null;
        await axios.post(SERVER_URL + `/games/${this.publicKeyBase58}`, {
          gameId: this.zkAppAddress,
        });
      } catch (err: any) {
        this.error = err?.message || err;
        console.log('error ', err);
      } finally {
        this.loading = false;
      }
    },
    async claimRewardTransaction() {
      try {
        this.loading = true;
        this.stepDisplay = 'Creating a transaction...';
        await this.zkappWorkerClient!.createClaimRewardTransaction(
          this.publicKeyBase58
        );
        this.stepDisplay = 'Generating proof...';
        await this.zkappWorkerClient!.proveTransaction();
        this.stepDisplay = 'Getting transaction JSON...';
        const transactionJSON =
          await this.zkappWorkerClient!.getTransactionJSON();
        this.stepDisplay = 'Requesting send transaction...';
        const { hash } = await (window as any).mina.sendTransaction({
          transaction: transactionJSON,
          feePayer: {
            memo: '',
          },
        });
        this.currentTransactionLink = hash;
        this.stepDisplay = '';
        this.error = null;
      } catch (err: any) {
        this.error = err?.message || err;
        console.log('error ', err);
      } finally {
        this.loading = false;
      }
    },
    async getRole() {
      this.userRole = await this.zkappWorkerClient!.getUserRole(
        this.publicKeyBase58
      );
    },
    setLastTransactionHash(hash: string) {
      this.lastTransactionLink = hash;
    },
  },
});
