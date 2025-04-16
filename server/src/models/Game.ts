import mongoose, { Schema, Document } from 'mongoose';

export enum GameStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
}

export interface IGame extends Document {
  _id: string;
  lastProof: any;
  maxAttempts: number;
  rewardAmount: number;
  timestamp: number;
  codeBreaker?: string;
  codeMaster: string;
  winnerPublicKeyBase58?: string;
  status: GameStatus;
  settlementTransactionHash?:string;
}

const gameSchema: Schema = new Schema(
  {
    _id: { type: String, required: true },
    lastProof: { type: Schema.Types.Mixed, required: true },
    maxAttempts: { type: Number, required: true },
    rewardAmount: { type: Number, required: true },
    timestamp: { type: Number, default: Date.now },
    codeBreaker: { type: String, required: false },
    codeMaster: { type: String, required: true },
    winnerPublicKeyBase58: { type: String, required: false },
    status: {
      type: String,
      enum: Object.values(GameStatus),
      default: GameStatus.PENDING,
      required: true,
    },
    settlementTransactionHash: { type: String, required: false },
  },
  { timestamps: true }
);

const Game = mongoose.model<IGame>('Game', gameSchema);

export default Game;
