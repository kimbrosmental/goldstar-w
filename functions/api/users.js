export async function onRequest(context) {
	const { request, env } = context;
	if (request.method === 'GET') {
		const kv = env.USERS;
		const list = [];
		for await (const key of kv.list()) {
			const user = await kv.get(key.name);
			if (user) list.push(JSON.parse(user));
		}
		return new Response(JSON.stringify(list), { status: 200 });
	}
	return new Response('Method Not Allowed', { status: 405 });
}
