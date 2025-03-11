import { Cache } from "o1js";
import fs from "fs";
import { MastermindZkApp, StepProgram } from "mina-mastermind-recursive";

const cacheZkApp = async () => {
  const zkAppCache: Cache = Cache.FileSystem("./zkAppCache");
  const zkProgramCache: Cache = Cache.FileSystem("./zkProgramCache");
  await StepProgram.compile({ cache: zkProgramCache });
  await MastermindZkApp.compile({ cache: zkAppCache });
};

cacheZkApp();
