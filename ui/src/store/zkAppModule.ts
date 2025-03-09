import { defineStore } from "pinia";
import ZkappWorkerClient from "../zkappWorkerClient";
import { WebSocketService } from "../services/websocket";
import { StepProgramProof } from "mina-mastermind";
import { serializeSecret } from "../utils";

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
const TRANSACTION_FEE = 0.1;

export const useZkAppStore = defineStore("useZkAppModule", {
  state: () => ({
    zkappWorkerClient: null as null | ZkappWorkerClient,
    hasWallet: null as null | boolean,
    stepDisplay: "" as string,
    hasBeenSetup: false,
    accountExists: false,
    publicKeyBase58: null as null | any,
    requestedConnexion: false,
    error: null as Object | any,
    loading: false,
    currentTransactionLink: "",
    zkAppStates: null as null | any,
    zkProofStates: null as null | any,
    compiled: false,
    zkAppAddress: null as null | string,
    webSocketInstance: null as null | WebSocketService,
  }),
  getters: {},
  actions: {
    async setupZkApp() {
      if (window.mina) {
        try {
          this.requestedConnexion = true;
          this.stepDisplay = "Loading web worker...";
          this.zkappWorkerClient = new ZkappWorkerClient();
          await new Promise((resolve) => setTimeout(resolve, 500));
          this.stepDisplay = "Setting Mina instance...";
          await this.zkappWorkerClient.setActiveInstanceToLightnet();
          const accounts = await window.mina.requestAccounts();
          this.publicKeyBase58 = accounts[0];
          this.stepDisplay = "Checking if fee payer account exists...";
          const res = await this.zkappWorkerClient.fetchAccount(
            this.publicKeyBase58
          );
          this.accountExists = res.error === null;
          await this.zkappWorkerClient.loadContract();
          this.stepDisplay = "Compiling zkApp...";

          await this.zkappWorkerClient.compileContract();
          this.stepDisplay = "";
          this.compiled = true;
          this.hasBeenSetup = true;
          this.hasWallet = true;
          window.mina?.on("accountsChanged", async (accounts: string[]) => {
            if (accounts.length) {
              this.publicKeyBase58 = accounts[0];
            } else {
              const newAccounts = await window.mina?.requestAccounts();
              this.publicKeyBase58 = newAccounts?.[0];
            }
          });
          console.log("setup completed...");
          this.error = null;
        } catch (error: any) {
          return { message: error.message };
        }
      } else {
        this.hasWallet = false;
        this.stepDisplay = "Mina Wallet not detected";

        this.error = {
          message: "Mina Wallet not detected. Please install Auro Wallet.",
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
      this.webSocketInstance = new WebSocketService(
        gameId ?? (this.zkAppAddress as string)
      );
      this.webSocketInstance.connect();
      this.webSocketInstance.onMessage(async (data: any) => {
        await this.setLastProof(data.zkProof);
        await this.getZkAppStates();
        await this.getZkProofStates();
      });
    },
    async signFields(content: object): Promise<SignedData | null> {
      let signedData = null;
      try {
        this.loading = true;
        this.stepDisplay = "Signing a message...";
        signedData = await (window as any).mina.signFields({
          message: content,
        });
        this.stepDisplay = "";
        this.error = null;
      } catch (err: any) {
        this.error = err?.message || err;
        console.log("error ", err);
      } finally {
        return signedData;
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
        this.stepDisplay = "Creating a transaction...";
        const combination = serializeSecret(separatedSecretCombination);
        const signedData = await this.signFields([combination, salt]);
        if (signedData) {
          this.zkAppAddress =
            await this.zkappWorkerClient!.createInitGameTransaction(
              this.publicKeyBase58,
              combination,
              salt,
              maxAttempts,
              refereePubKeyBase58,
              rewardAmount
            );
          this.stepDisplay = "Creating proof...";
          await this.zkappWorkerClient!.proveTransaction();
          this.stepDisplay = "Getting transaction JSON...";
          const transactionJSON =
            await this.zkappWorkerClient!.getTransactionJSON();
          this.stepDisplay = "Requesting send transaction...";
          const { hash } = await (window as any).mina.sendTransaction({
            transaction: transactionJSON,
            feePayer: {
              fee: TRANSACTION_FEE,
              memo: "",
            },
          });
          await this.joinGame(); 

          const res = await this.zkappWorkerClient!.sendNewGameProof(
            signedData,
            combination,
            salt
          );
          this.webSocketInstance?.sendProof(JSON.stringify(res));
        }
        this.stepDisplay = "";
        this.error = null;
      } catch (err: any) {
        this.error = err?.message || err;
        console.log("error ", err);
      } finally {
        this.loading = false;
        return this.zkAppAddress;
      }
    },
    async createGuessProof(code: number[]) {
      try {
        this.loading = true;
        this.stepDisplay = "Creating a transaction...";
        const combination = serializeSecret(code);
        const signedData = await this.signFields([
          combination,
          this.zkProofStates.turnCount,
        ]);
        if (signedData) {
          const res = await this.zkappWorkerClient!.createGuessProof(
            signedData,
            combination
          );
          this.webSocketInstance?.sendProof(JSON.stringify(res));
          await this.getZkProofStates();
        }

        this.stepDisplay = "";
        this.error = null;
      } catch (err: any) {
        this.error = err?.message || err;
        console.log("error ", err);
      } finally {
        this.loading = false;
        return this.zkAppAddress;
      }
    },
    async createGiveClueProof(code: number[], randomSalt: string) {
      try {
        this.loading = true;
        this.stepDisplay = "Creating a transaction...";
        const combination = serializeSecret(code);
        const signedData = await this.signFields([
          combination,
          randomSalt,
          this.zkProofStates.turnCount,
        ]);
        if (signedData) {
          const res = await this.zkappWorkerClient!.createGiveClueProof(
            signedData,
            combination,
            randomSalt
          );
          this.webSocketInstance?.sendProof(JSON.stringify(res));
          await this.getZkProofStates();
        }
        this.stepDisplay = "";
        this.error = null;
      } catch (err: any) {
        this.error = err?.message || err;
        console.log("error ", err);
      } finally {
        this.loading = false;
        return this.zkAppAddress;
      }
    },
    async submitGameProof() {
      try {
        this.loading = true;
        this.stepDisplay = "Creating a transaction...";
        await this.zkappWorkerClient!.submitGameProof();
        this.stepDisplay = "Creating proof...";
        await this.zkappWorkerClient!.proveTransaction();
        this.stepDisplay = "Getting transaction JSON...";
        const transactionJSON =
          await this.zkappWorkerClient!.getTransactionJSON();
        this.stepDisplay = "Requesting send transaction...";
        const { hash } = await (window as any).mina.sendTransaction({
          transaction: transactionJSON,
          feePayer: {
            fee: TRANSACTION_FEE,
            memo: "",
          },
        });
        this.stepDisplay = "";
        this.error = null;
      } catch (err: any) {
        this.error = err?.message || err;
        console.log("error ", err);
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
        console.log("fetching zkApp states ...")
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
        this.stepDisplay = "Creating a transaction...";
        await this.zkappWorkerClient!.createAcceptGameTransaction(
          this.publicKeyBase58
        );
        this.stepDisplay = "Creating proof...";
        await this.zkappWorkerClient!.proveTransaction();
        this.stepDisplay = "Getting transaction JSON...";
        const transactionJSON =
          await this.zkappWorkerClient!.getTransactionJSON();
        this.stepDisplay = "Requesting send transaction...";
        const { hash } = await (window as any).mina.sendTransaction({
          transaction: transactionJSON,
          feePayer: {
            fee: TRANSACTION_FEE,
            memo: "",
          },
        });
        await this.joinGame();
        this.stepDisplay = "";
        this.error = null;
      } catch (err: any) {
        this.error = err?.message || err;
        console.log("error ", err);
      } finally {
        this.loading = false;
      }
    },
    async penalizePlayerTransaction(playerPubKeyBase58:string) {
      try {
        this.loading = true;
        this.stepDisplay = "Creating a transaction...";
        await this.zkappWorkerClient!.createPenalizePlayerTransaction(
          this.publicKeyBase58,
          playerPubKeyBase58
        );
        this.stepDisplay = "Creating proof...";
        await this.zkappWorkerClient!.proveTransaction();
        this.stepDisplay = "Getting transaction JSON...";
        const transactionJSON =
          await this.zkappWorkerClient!.getTransactionJSON();
        this.stepDisplay = "Requesting send transaction...";
        const { hash } = await (window as any).mina.sendTransaction({
          transaction: transactionJSON,
          feePayer: {
            fee: TRANSACTION_FEE,
            memo: "",
          },
        });
        this.stepDisplay = "";
        this.error = null;
      } catch (err: any) {
        this.error = err?.message || err;
        console.log("error ", err);
      } finally {
        this.loading = false;
      }
    },
  },
});
