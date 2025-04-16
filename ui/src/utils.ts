import {
  deserializeClueHistory,
  deserializeCombinationHistory,
  validateCombination,
} from '@navigators-exploration-team/mina-mastermind';
import { availableColors, cluesColors } from './constants/colors';
import { AvailableColor } from './types';
import { Field, Cache } from 'o1js';

export function formatAddress(address: string) {
  return `${address?.slice(0, 5)}...${address?.slice(-5)}`;
}
export function generateColoredGuessHistory(
  packedGuessHistory: Field
): Array<AvailableColor[]> {
  try {
    const deserializedGuessHistory =
      deserializeCombinationHistory(packedGuessHistory);
    const guesses = deserializedGuessHistory.map((e: Field) => e.toString());
    return guesses.map((e: string) => {
      return e === '0'
        ? Array.from({ length: 4 }, () => ({ color: '#222', value: 0 }))
        : e.split('').map((num: string) => {
            const colorObj = availableColors.find(
              (c) => c.value === Number(num)
            );
            return colorObj ?? { color: '#222', value: 0 };
          });
    });
  } catch (error) {
    console.error('error: ', error);
    return [];
  }
}
export function generateColoredCluesHistory(
  packedClueHistory: Field,
  round: number
): Array<AvailableColor[]> {
  function transformToBinary(arr: string[]): string[] {
    return arr.map((str) => {
      let num = parseInt(str, 10);
      if (isNaN(num) || num < 0 || num > 255) {
        throw new Error(`Invalid input: ${str}`);
      }
      let binary = num.toString(2).padStart(8, '0');
      let groups = binary.match(/../g) as string[];
      return groups
        .map((b) => parseInt(b, 2))
        .reverse()
        .join('');
    });
  }
  const deserializedClueHistory = deserializeClueHistory(packedClueHistory);
  const cluess = deserializedClueHistory.map((e: Field) => e.toString());
  const binaryClues = transformToBinary(cluess);
  return binaryClues.map((numStr, index) => {
    return index >= Math.floor((round - 1) / 2)
      ? Array.from({ length: 4 }, () => ({ color: '#222', value: 0 }))
      : numStr.split('').map((num) => {
          const colorObj = cluesColors.find((c) => c.value === Number(num));
          return colorObj ?? { color: '#222', value: 0 };
        });
  });
}
export function validateColorCombination(combination: AvailableColor[]) {
  const combinationDigits = combination.map(({ value }) => Field(value));
  let isValid = true;
  try {
    validateCombination(combinationDigits);
    return {
      isValid,
      message: '',
    };
  } catch (err: any) {
    isValid = false;
    return {
      isValid,
      message: 'You should choose four distinct colors.',
    };
  }
}
export function generateRandomSalt(length = 20): string {
  const chars = '123456789';
  let randomSalt = '';
  for (let i = 0; i < length; i++) {
    randomSalt += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return randomSalt;
}

export const MinaFileSystem = (files: any): Cache => ({
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
  write({}: any, _data: any) {
    //console.log('write');
    // console.log({ persistentId, uniqueId, dataType });
  },
  canWrite: true,
});
export function fetchZkAppCacheFiles() {
  const files = [
    { name: 'lagrange-basis-fp-2048', type: 'string' },
    { name: 'step-vk-mastermindzkapp-acceptgame', type: 'string' },
    { name: 'step-vk-mastermindzkapp-claimreward', type: 'string' },
    { name: 'step-vk-mastermindzkapp-forfeitwin', type: 'string' },
    { name: 'step-vk-mastermindzkapp-giveclue', type: 'string' },
    { name: 'step-vk-mastermindzkapp-initgame', type: 'string' },
    { name: 'step-vk-mastermindzkapp-makeguess', type: 'string' },
    { name: 'step-vk-mastermindzkapp-submitgameproof', type: 'string' },
    { name: 'wrap-vk-mastermindzkapp', type: 'string' },
  ];
  return fetchFiles(files, 'zkAppCache');
}
export function fetchZkProgramCacheFiles() {
  const files = [
    { name: 'srs-fp-65536', type: 'string' },
    { name: 'srs-fq-32768', type: 'string' },
    { name: 'lagrange-basis-fq-16384', type: 'string' },
    { name: 'lagrange-basis-fp-16384', type: 'string' },
    { name: 'lagrange-basis-fp-8192', type: 'string' },
    { name: 'step-vk-stepprogram-creategame', type: 'string' },
    { name: 'step-vk-stepprogram-giveclue', type: 'string' },
    { name: 'step-vk-stepprogram-makeguess', type: 'string' },
    { name: 'wrap-vk-stepprogram', type: 'string' },
  ];
  return fetchFiles(files, 'zkProgramCache');
}
export function fetchFiles(
  files: Array<{ name: string; type: string }>,
  folder: string
) {
  return Promise.all(
    files.map((file) => {
      return Promise.all([
        fetch(`/${folder}/${file.name}.header`).then((res) => res.text()),
        fetch(`/${folder}/${file.name}`).then((res) => res.text()),
      ]).then(([header, data]) => ({ file, header, data }));
    })
  ).then((cacheList) =>
    cacheList.reduce((acc: any, { file, header, data }) => {
      acc[file.name] = { file, header, data };

      return acc;
    }, {})
  );
}
export function serializeSecret(code: number[]) {
  return code.reduce((acc: number, curr: number) => {
    return acc * 10 + curr;
  }, 0);
}
export function dateToDayHourMin(timestamp?: number): string {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  const datePart = date.toLocaleDateString('en-CA');
  const timePart = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return `${datePart.replace(/-/g, '/')} ${timePart}`;
}
