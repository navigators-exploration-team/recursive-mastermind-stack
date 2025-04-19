export interface AvailableColor {
  color: string;
  value: number;
  title?: string;
}

export interface ZkAppStates {
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
  rewardAmount: number | null;
  refereePubKeyBase58: string;
}
export interface Game {
  _id: string;
  rewardAmount: string;
  codeMaster: string;
  status: string;
  lastAcceptTimestamp: number;
}
