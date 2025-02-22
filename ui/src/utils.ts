import { validateCombination } from "mina-mastermind";
import { availableColors, cluesColors } from "./constants/colors";
import { AvailableColor } from "./types";
import { Field , Cache} from "o1js";

export function formatAddress(address: string) {
  return `${address.slice(0, 5)}...${address.slice(-5)}`;
}
export function createGuessesMatrix(guesses: string): AvailableColor[][] {
  try {
    const arr: string[] = JSON.parse(guesses);
    return arr.map((numStr) =>
      numStr === "0"
        ? Array.from({ length: 4 }, () => ({ color: "#222", value: 0 }))
        : numStr.split("").map((num) => {
            const colorObj = availableColors.find(
              (c) => c.value === Number(num)
            );
            return colorObj ?? { color: "#222", value: 0 };
          })
    );
  } catch (error) {
    console.error("Invalid JSON input:", error);
    return [];
  }
}
export function createCluesMatrix(
  clues: string[],
  round: number
): AvailableColor[][] {
  try {
    return clues.map((numStr, index) => {
      return index >= Math.floor((round - 1) / 2)
        ? Array.from({ length: 4 }, () => ({ color: "#222", value: 0 }))
        : numStr.split("").map((num) => {
            const colorObj = cluesColors.find((c) => c.value === Number(num));
            return colorObj ?? { color: "#222", value: 0 };
          });
    });
  } catch (error) {
    console.error("Invalid JSON input:", error);
    return [];
  }
}
export function transformBinaryArray(arr: string[]): string[] {
  return arr.map((str) => {
    let num = parseInt(str, 10);
    if (isNaN(num) || num < 0 || num > 255) {
      throw new Error(`Invalid input: ${str}`);
    }
    let binary = num.toString(2).padStart(8, "0");
    let groups = binary.match(/../g) as string[];
    return groups
      .map((b) => parseInt(b, 2))
      .reverse()
      .join("");
  });
}

export function validateColorCombination(combination: AvailableColor[]) {
  const combinationDigits = combination.map(({value}) => Field(value))
  let isValid = true
  try {
    validateCombination(combinationDigits)
    return {
      isValid,
      message:""
    }
  }
  catch(err:any) {
    isValid = false 
    return {
      isValid,
      message:"You should choose four distinct colors."
    }
  }
  
}

export const MinaFileSystem = (files: any) : Cache => ({
  read({ persistentId, uniqueId, dataType }: any) {
    // read current uniqueId, return data if it matches
    if (!files[persistentId]) {
     // console.log('read');
     // console.log({ persistentId, uniqueId, dataType });

      return undefined;
    }
    
    const currentId = files[persistentId].header;

    if (currentId !== uniqueId) {
      // console.log('current id did not match persistent id');

      return undefined;
    }

    if (dataType === 'string') {
      // console.log('found in cache', { persistentId, uniqueId, dataType });

      return new TextEncoder().encode(files[persistentId].data);
    }

    return undefined;
  },
  write({ persistentId, uniqueId, dataType }: any, data: any) {
    //console.log('write');
   // console.log({ persistentId, uniqueId, dataType });
  },
  canWrite: true,
});

export function fetchFiles() {
  const files = [
    { name:'srs-fp-65536', type: 'string' },
    { name:'srs-fq-32768', type: 'string' },
    { name:'step-vk-mastermindzkapp-creategame', type: 'string' },
    { name:'step-vk-mastermindzkapp-giveclue', type: 'string' },
    { name:'step-vk-mastermindzkapp-initgame', type: 'string' },
    { name:'step-vk-mastermindzkapp-makeguess', type: 'string' },
    { name:'wrap-vk-mastermindzkapp', type: 'string' },
    { name:'lagrange-basis-fp-1024', type: 'string' },
    { name:'lagrange-basis-fp-8192', type: 'string' },
  
  ]
  return Promise.all(files.map((file) => {
    return Promise.all([
      fetch(`/zkAppCache/${file.name}.header`).then(res => res.text()),
      fetch(`/zkAppCache/${file.name}`).then(res => res.text())
    ]).then(([header, data]) => ({ file, header, data }));
  }))
  .then((cacheList) => cacheList.reduce((acc: any, { file, header, data }) => {
    acc[file.name] = { file, header, data };

    return acc;
  }, {}));
}
