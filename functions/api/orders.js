export async function onRequest(context) {
	const { request, env } = context;
	if (request.method === 'GET') {
		const kv = env.ORDERS;
		const list = [];
		for await (const key of kv.list()) {
			const order = await kv.get(key.name);
			if (order) list.push(JSON.parse(order));
		}
		return new Response(JSON.stringify(list), { status: 200 });
	}
	return new Response('Method Not Allowed', { status: 405 });
}
