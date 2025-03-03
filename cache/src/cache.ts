import { Cache } from "o1js";
import fs from "fs";
import { MastermindZkApp, StepProgram } from "mina-mastermind";

function isEmptyDirectory(directoryPath: string): boolean {
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error(`Error reading directory: ${err.message}`);
      return true;
    }
    if (files.length === 0) {
      console.log("Directory is empty.");
      return true;
    } else {
      console.log("Directory is not empty.");
      return false;
    }
  });
  return true;
}

const cacheZkApp = async () => {
  const zkAppCache: Cache = Cache.FileSystem("./zkAppCache");
  const zkProgramCache: Cache = Cache.FileSystem("./zkProgramCache");
  if (isEmptyDirectory("./zkProgramCache")) {
    await StepProgram.compile({ cache: zkProgramCache });
  }

  if (isEmptyDirectory("./zkAppCache")) {
    await MastermindZkApp.compile({ cache: zkAppCache });
  }
};

cacheZkApp();
