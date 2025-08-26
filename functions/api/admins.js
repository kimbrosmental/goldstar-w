export async function onRequest(context) {
	const { request, env } = context;
	if (request.method === 'GET') {
		const kv = env.SECURITY;
		const list = [];
		for await (const key of kv.list()) {
			const admin = await kv.get(key.name);
			if (admin) list.push(JSON.parse(admin));
		}
		return new Response(JSON.stringify(list), { status: 200 });
	}
	return new Response('Method Not Allowed', { status: 405 });
}
