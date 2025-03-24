const CLOUDFLARE_WORKER_URL = process.env.CLOUDFLARE_WORKER_URL;
import dotenv from 'dotenv';
dotenv.config();
export async function getGame(gameId: string) {
  const response = await fetch(`${CLOUDFLARE_WORKER_URL}/game/${gameId}`);
  if (!response.ok) return null;
  const res = await response.json();
  if (!Object.keys(res).length) {
    return null;
  }
  return res;
}

export async function saveGame(gameId: string, data: any) {
  try {
    await fetch(`${CLOUDFLARE_WORKER_URL}/game/${gameId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (e) {
    console.log('error while saving game ', e);
  }
}
