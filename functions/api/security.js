export async function onRequest(context) {
	const { request, env } = context;
	if (request.method === 'GET') {
		const kv = env.SECURITY;
		const list = [];
		for await (const key of kv.list()) {
			const sec = await kv.get(key.name);
			if (sec) list.push(JSON.parse(sec));
		}
		return new Response(JSON.stringify(list), { status: 200 });
	}
	return new Response('Method Not Allowed', { status: 405 });
}
