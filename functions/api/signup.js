export async function onRequest(context) {
	const { request, env } = context;
	if (request.method === 'POST') {
		const data = await request.json();
		const kv = env.USERS;
		const key = String(data.username).replace(/[^a-zA-Z0-9]/g, '').toLowerCase().trim();
		if (!key) return new Response('아이디를 입력하세요.', { status: 400 });
		if (await kv.get(key)) return new Response('이미 존재하는 아이디입니다.', { status: 409 });
		await kv.put(key, JSON.stringify(data));
		return new Response('회원가입 완료', { status: 200 });
	}
	return new Response('Method Not Allowed', { status: 405 });
}
