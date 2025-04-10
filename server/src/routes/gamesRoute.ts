import { Router, Request, Response } from 'express';
import {
  createOrUpdateGame,
  getActiveGames,
  getUserGames,
} from '../repositories/game.js';

const router = Router();

router.get('/active-games', async (req: Request, res: Response) => {
  try {
    const games = await getActiveGames();
    res.status(200).json(games);
  } catch (error) {
    console.error('Error fetching answer  list:', error);
    res.status(500).json({ message: 'Failed to find answer list' });
  }
});
router.post('/accept/:id', async (req: Request, res: Response) => {
  try {
    const jsonGame = req.body;
    const userId = req.params.id;
    const game = await createOrUpdateGame({_id:jsonGame.gameId,codeBreaker:userId});
    res.status(200).json({ game });
  } catch (error) {
    console.error('Error saving answer:', error);
    res.status(500).json({ message: 'Failed to save answer' });
  }
});
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



export default router;
