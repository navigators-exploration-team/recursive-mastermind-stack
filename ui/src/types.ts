export interface AvailableColor {
  color: string;
  value: number;
}

export interface ZkAppStates {
  maxAttempts: number;
  turnCount: number;
  isSolved: boolean;
  codemasterId: string;
  codebreakerId: string;
  solutionHash: string;
  packedGuessHistory: string;
  packedClueHistory: string;
}

export interface CodePicker {
  code: AvailableColor[];
  randomSalt: string;
}

export interface GameParams {
  maxAttempts: number | null;
  rewardAmount: number | null;
  refereePubKeyBase58: string;
}
export interface Game {
  _id: string;
  maxAttempts: string;
  rewardAmount: string;
}
