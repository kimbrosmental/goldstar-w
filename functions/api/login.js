export async function onRequest(context) {
	const { request, env } = context;
	if (request.method === 'POST') {
		const { username, password } = await request.json();
		const kv = env.USERS;
		const key = String(username).replace(/[^a-zA-Z0-9]/g, '').toLowerCase().trim();
		const user = await kv.get(key);
		if (!user) return new Response('존재하지 않는 아이디입니다.', { status: 404 });
		const userObj = JSON.parse(user);
		if (userObj.password !== password) return new Response('비밀번호가 일치하지 않습니다.', { status: 401 });
		return new Response(JSON.stringify(userObj), { status: 200 });
	}
	return new Response('Method Not Allowed', { status: 405 });
}
