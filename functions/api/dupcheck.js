export async function onRequestPost(context) {
  const { username } = await context.request.json();
  const kv = context.env.USERS;
  if (!username) return new Response('아이디를 입력하세요.', { status: 400 });
  if (await kv.get(username)) {
    return new Response('이미 사용중인 아이디입니다.', { status: 409 });
  }
  return new Response('사용 가능한 아이디입니다.', { status: 200 });
}
