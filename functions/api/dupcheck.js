
export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }
  if (request.method === 'POST') {
    const { username } = await request.json();
    const kv = env.USERS;
    const key = String(username).replace(/[^a-zA-Z0-9]/g, '').toLowerCase().trim();
    if (!key) return new Response('아이디를 입력하세요.', {
      status: 400,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
    if (await kv.get(key)) {
      return new Response('이미 사용중인 아이디입니다.', {
        status: 409,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }
    return new Response('사용 가능한 아이디입니다.', {
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
  return new Response('Method Not Allowed', {
    status: 405,
    headers: { 'Access-Control-Allow-Origin': '*' }
  });
}
