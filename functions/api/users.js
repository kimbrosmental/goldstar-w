export async function onRequestGet(context) {
  const kv = context.env.USERS;
  const list = await kv.list();
  const users = [];
  for (const key of list.keys) {
    const user = await kv.get(key.name);
    if (user) users.push(JSON.parse(user));
  }
  return new Response(JSON.stringify(users), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function onRequestPost(context) {
  // 회원정보 수정/승인 등은 필요시 구현
  return new Response('Not implemented', { status: 501 });
}
