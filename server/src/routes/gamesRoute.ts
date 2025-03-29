import { Router, Request, Response } from 'express';
import { getUserGames, saveUserGame } from '../kvStorageService.js';

const router = Router();

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const games = await getUserGames(userId);
    res.status(200).json({ games });
  } catch (error) {
    console.error('Error fetching answer  list:', error);
    res.status(500).json({ message: 'Failed to find answer list' });
  }
});

router.post('/:id', async (req: Request, res: Response) => {
  try {
    const jsonGame = req.body;
    const userId = req.params.id;
    const games = await getUserGames(userId) || [];
    await saveUserGame(userId, [...games, jsonGame.gameId]);
    res.status(200).json({ games });
  } catch (error) {
    console.error('Error saving answer:', error);
    res.status(500).json({ message: 'Failed to save answer' });
  }
});

export default router;
