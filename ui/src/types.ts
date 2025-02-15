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
