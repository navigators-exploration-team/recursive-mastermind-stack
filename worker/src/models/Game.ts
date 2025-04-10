import mongoose, { Schema, Document } from 'mongoose';

export interface IGame extends Document {
  _id: string;
  lastProof: any;
  maxAttempts: number;
  rewardAmount: number;
  timestamp: number;
  codeBreaker: string;
  codeMaster: string;
  winnerId: string;
  isActive: boolean;
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
    winnerId: { type: String, required: false },
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Game = mongoose.model<IGame>('Game', gameSchema);

export default Game;
