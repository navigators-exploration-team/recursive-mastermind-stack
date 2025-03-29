/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request: Request, env: any) {
		const url = new URL(request.url);
		const { method } = request;

		if (method === 'GET' && url.pathname.startsWith('/game/')) {
			const gameId = url.pathname.split('/').pop();
			if (!gameId) return new Response('Missing game ID', { status: 400 });

			const gameData = await env.GAME_KV.get(gameId);
			return new Response(gameData || '{}', { status: 200 });
		}
		if (method === 'GET' && url.pathname.startsWith('/user/')) {
			const userId = url.pathname.split('/').pop();
			if (!userId) return new Response('Missing user ID', { status: 400 });

			const userData = await env.USER_KV.get(userId);
			return new Response(userData || '{}', { status: 200 });
		}
		if (method === 'POST' && url.pathname.startsWith('/game/')) {
			const gameId = url.pathname.split('/').pop();
			if (!gameId) return new Response('Missing game ID', { status: 400 });

			const body = await request.text();
			await env.GAME_KV.put(gameId, body);

			return new Response('OK', { status: 200 });
		}
		if (method === 'POST' && url.pathname.startsWith('/user/')) {
			const userId = url.pathname.split('/').pop();
			if (!userId) return new Response('Missing user ID', { status: 400 });

			const body = await request.text();
			await env.USER_KV.put(userId, body);

			return new Response('OK', { status: 200 });
		}

		return new Response('Not Found', { status: 404 });
	},
};
