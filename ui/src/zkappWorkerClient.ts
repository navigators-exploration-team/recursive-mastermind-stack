import { fetchAccount } from "o1js";

import type { ZkappWorkerRequest, ZkappWorkerReponse, WorkerFunctions } from "./zkappWorker";
import { SignedData } from "./store/zkAppModule";

export default class ZkappWorkerClient {
    // worker functions

    async setActiveInstanceToLightnet() {
        return this._call("setActiveInstanceToLightnet", {});
    }

    async loadContract() {
        return this._call("loadContract", {});
    }

    async compileContract() {
        return this._call("compileContract", {});
    }

    async fetchAccount(publicKey: string): ReturnType<typeof fetchAccount> {
        const result = this._call("fetchAccount", {
            publicKey58: publicKey,
        });
        return result as ReturnType<typeof fetchAccount>;
    }

    async proveTransaction() {
        return this._call("proveTransaction", {});
    }

    async getTransactionJSON() {
        const result = await this._call("getTransactionJSON", {});
        return result;
    }
    async initZkappInstance(publicKeyBase58: string) {
        return await this._call("initZkappInstance", { publicKeyBase58 });
    }
    async createInitGameTransaction(
        feePayer: string,
        unseparatedSecretCombination: number,
        salt: string,
        maxAttempts: number,
        refereePubKeyBase58: string,
        rewardAmount: number
    ): Promise<string> {
        const result = this._call("createInitGameTransaction", {
            feePayer,
            unseparatedSecretCombination,
            salt,
            maxAttempts,
            refereePubKeyBase58,
            rewardAmount,
        });
        return result as Promise<string>;
    }
    async createAcceptGameTransaction(feePayer: string) {
        const result = this._call("createAcceptGameTransaction", {
            feePayer,
        });
        return result as Promise<string>;
    }
    async sendNewGameProof(
        signedData: SignedData,
        unseparatedSecretCombination: number,
        salt: string
    ) {
        return this._call("sendNewGameProof", {
            signedData,
            unseparatedSecretCombination,
            salt,
        });
    }
    async createGuessProof(signedData: SignedData, unseparatedGuess: number) {
        return this._call("createGuessProof", {
            signedData,
            unseparatedGuess,
        });
    }
    async createGiveClueProof(
        signedData: SignedData,
        secretCombination: number,
        randomSalt: string
    ) {
        return this._call("createGiveClueProof", {
            signedData,
            secretCombination,
            randomSalt,
        });
    }
    async getZkAppStates() {
        return this._call("getZkAppStates", {});
    }
    async getZkProofStates() {
        return await this._call("getZkProofStates", {});
    }
    async getUserRole(playerPubKeyBase58: string) {
        return (await this._call("getUserRole", {
            playerPubKeyBase58,
        })) as Promise<string>;
    }
    async setLastProof(zkProof: any) {
        return this._call("setLastProof", { zkProof });
    }
    async submitGameProof() {
        return this._call("submitGameProof", {});
    }
    async createClaimRewardTransaction(feePayer: string) {
        return this._call("createClaimRewardTransaction", {
            feePayer,
        });
    }
    // worker initialization

    worker: Worker;

    promises: {
        [id: number]: { resolve: (res: any) => void; reject: (err: any) => void };
    };

    nextId: number;

    constructor() {
        this.worker = new Worker(new URL("./zkappWorker.ts", import.meta.url), {
            type: "module",
        });
        this.promises = {};
        this.nextId = 0;

        this.worker.onmessage = (event: MessageEvent<ZkappWorkerReponse>) => {
            const { id, data, error } = event.data as any;
            if (error) {
                this.promises[id].reject(new Error(error));
            } else {
                this.promises[id].resolve(data);
            }

            delete this.promises[id];
        };
    }

    _call(fn: WorkerFunctions, args: any) {
        try {
            return new Promise((resolve, reject) => {
                this.promises[this.nextId] = { resolve, reject };

                const message: ZkappWorkerRequest = {
                    id: this.nextId,
                    fn,
                    args,
                };

                this.worker.postMessage(message);

                this.nextId++;
            });
        } catch (err) {
            console.log(err);
        }
    }
}
