import { defineStore } from "pinia";
import ZkappWorkerClient from "../zkappWorkerClient";

interface MinaWallet {
  requestAccounts: () => Promise<string[]>;
  signMessage: (args: {
    message: string;
  }) => Promise<{ publicKey: string; signature: string }>;
  on: (event:string,handler:Function) => void
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
    compiled: false,
    zkAppAddress: null as null | string,
  }),
  getters: {},
  actions: {
    async setupZkApp() {
      if (window.mina) {
        try {
          this.requestedConnexion = true;
          this.stepDisplay = "Loading web worker...";
          this.zkappWorkerClient = new ZkappWorkerClient();
          await new Promise((resolve) => setTimeout(resolve, 5000));
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
          window.mina?.on("accountsChanged",async (accounts: string[]) => {
            if(accounts.length) {
              this.publicKeyBase58 = accounts[0];
            }else{
              const newAccounts = await window.mina?.requestAccounts();
              this.publicKeyBase58 = newAccounts?.[0];
            }
          });
          console.log("setup completed...");
          this.error = null
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
      this.error = null
    },
    async createInitGameTransaction(rounds: number) {
      try {
        this.loading = true;
        this.stepDisplay = "Creating a transaction...";
        this.zkAppAddress =
          await this.zkappWorkerClient!.createInitGameTransaction(
            this.publicKeyBase58,
            rounds
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
        this.error = null
      } catch (err:any) {
        this.error = err?.message || err
        console.log("error ", err);
      } finally {
        this.loading = false;
        return this.zkAppAddress;
      }
    },
    async createNewGameTransaction(code: number[], randomSalt: string) {
      try {
        this.loading = true;
        this.stepDisplay = "Creating a transaction...";
        await this.zkappWorkerClient!.createNewGameTransaction(
          this.publicKeyBase58,
          code,
          randomSalt
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
        this.error = null

      } catch (err:any) {
        this.error = err?.message || err
        console.log("error ", err);
      } finally {
        this.loading = false;
        return this.zkAppAddress;
      }
    },
    async createGuessTransaction(code: number[]) {
      try {
        this.loading = true;
        this.stepDisplay = "Creating a transaction...";
        await this.zkappWorkerClient!.createGuessTransaction(
          this.publicKeyBase58,
          code
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
        this.error = null

      } catch (err:any) {
        this.error = err?.message || err
        console.log("error ", err);
      } finally {
        this.loading = false;
        return this.zkAppAddress;
      }
    },
    async createGiveClueTransaction(code: number[], randomSalt: string) {
      try {
        this.loading = true;
        this.stepDisplay = "Creating a transaction...";
        await this.zkappWorkerClient!.createGiveClueTransaction(
          this.publicKeyBase58,
          code,
          randomSalt
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
        this.error = null

      } catch (err:any) {
        this.error = err?.message || err
        console.log("error ", err);
      } finally {
        this.loading = false;
        return this.zkAppAddress;
      }
    },
    async initZkappInstance(zkAppAddress: string) {
      await this.zkappWorkerClient!.initZkappInstance(zkAppAddress);
      this.zkAppAddress = zkAppAddress;
    },
    async getZkappStates() {
      try{
        this.zkAppStates = await this.zkappWorkerClient!.getZkappStates();
        this.error = null
      }catch(err:any){
        this.error = err.message
      }
    },
  },
});
