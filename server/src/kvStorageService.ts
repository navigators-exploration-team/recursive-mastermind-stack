const CLOUDFLARE_WORKER_URL = process.env.CLOUDFLARE_WORKER_URL;
import dotenv from 'dotenv';
dotenv.config();
export async function getGame(gameId: string, prefix?: string) {
  const computedGameId = prefix ? prefix + gameId : gameId;
  const response = await fetch(
    `${CLOUDFLARE_WORKER_URL}/game/${computedGameId}`
  );
  if (!response.ok) return null;
  const res = await response.json();
  if (!Object.keys(res).length) {
    return null;
  }
  return res;
}
export async function getActiveGames() {
  const response = await fetch(`${CLOUDFLARE_WORKER_URL}/active-games`);
  if (!response.ok) return null;
  const res = await response.json();
  if (!Object.keys(res).length) {
    return null;
  }
  return res;
}

export async function saveGame(gameId: string, data: any, prefix?: string) {
  try {
    const computedGameId = prefix ? prefix + gameId : gameId;
    await fetch(`${CLOUDFLARE_WORKER_URL}/game/${computedGameId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (e) {
    console.log('error while saving game ', e);
  }
}

export async function saveUserGame(userId: string, data: any) {
  try {
    await fetch(`${CLOUDFLARE_WORKER_URL}/user/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (e) {
    console.log('error while saving users game ', e);
  }
}

export async function getUserGames(userId: string) {
  const response = await fetch(`${CLOUDFLARE_WORKER_URL}/user/${userId}`);
  if (!response.ok) return null;
  const res = await response.json();
  if (!Object.keys(res).length) {
    return null;
  }
  return res;
}
