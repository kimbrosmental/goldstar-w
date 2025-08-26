export async function onRequest(context) {
	const { request, env } = context;
		const kv = env.SECURITY;
		if (request.method === 'GET') {
			// 암호화 데이터 지원: data 필드로 반환
			const raw = await kv.get('admins');
			if (raw) {
				return new Response(JSON.stringify({ data: raw }), { status: 200 });
			} else {
				// 기존 방식도 지원
				const list = [];
				for await (const key of kv.list()) {
					const admin = await kv.get(key.name);
					if (admin) list.push(JSON.parse(admin));
				}
				return new Response(JSON.stringify(list), { status: 200 });
			}
		}
		if (request.method === 'POST') {
			// 암호화된 admins 배열 저장
			const { data } = await request.json();
			if (!data) return new Response('Missing data', { status: 400 });
			await kv.put('admins', data);
			return new Response('ok', { status: 200 });
		}
		return new Response('Method Not Allowed', { status: 405 });
}
