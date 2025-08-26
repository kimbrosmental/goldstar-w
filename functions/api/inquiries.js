export async function onRequest(context) {
	const { request, env } = context;
	if (request.method === 'GET') {
		const kv = env.INQUIRIES;
		const list = [];
		for await (const key of kv.list()) {
			const inquiry = await kv.get(key.name);
			if (inquiry) list.push(JSON.parse(inquiry));
		}
		return new Response(JSON.stringify(list), { status: 200 });
	}
	return new Response('Method Not Allowed', { status: 405 });
}
