import { validateCombination } from "mina-mastermind";
import { availableColors, cluesColors } from "./constants/colors";
import { AvailableColor } from "./types";
import { Field } from "o1js";

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