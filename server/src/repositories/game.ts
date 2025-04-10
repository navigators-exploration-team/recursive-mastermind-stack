import dotenv from 'dotenv';
import Game, { IGame } from '../models/Game.js';
dotenv.config();

export const createOrUpdateGame = async (gameData: Partial<IGame>) => {
  try {
    const game = await Game.findOneAndUpdate({ _id: gameData._id }, gameData, {
      new: true,
      upsert: true,
    });
    return game;
  } catch (err) {
    throw new Error('Error creating or updating game: ' + err);
  }
};

export const getGameById = async (_id: string) => {
  try {
    const game = await Game.findOne({ _id });
    return game;
  } catch (err) {
    throw new Error('Error retrieving game by ID: ' + err);
  }
};

export const getActiveGames = async () => {
  try {
    const activeGames = await Game.find({ isActive: true });
    return activeGames;
  } catch (err) {
    throw new Error('Error retrieving active games: ' + err);
  }
};

export const getUserGames = async (userId: string) => {
  try {
    const userGames = await Game.find({
      $or: [{ codeMaster: userId }, { codeBreaker: userId }],
    });
    return userGames;
  } catch (err) {
    throw new Error('Error retrieving user games: ' + err);
  }
};
