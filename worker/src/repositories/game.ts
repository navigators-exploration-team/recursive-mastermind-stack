import dotenv from 'dotenv';
import Game, { GameStatus, IGame } from '../models/Game.js';
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

export const getPendingGames = async () => {
  try {
    const activeGames = await Game.find({ status: GameStatus.PENDING }, '_id').lean();
    return activeGames;
   } catch (err) {
    throw new Error('Error retrieving pending games: ' + err);
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

export const updateManyGames = async (activeGames: string[]) => {
  try {
     await Game.updateMany(
      { _id: { $in: activeGames } },
      { $set: { status: GameStatus.ACTIVE } }
    );
   } catch (err) {
    throw new Error('Error updating games : ' + err);
  }
};
