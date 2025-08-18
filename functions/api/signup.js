export async function onRequestPost(context) {
  const data = await context.request.json();
  const kv = context.env.USERS;
  if (await kv.get(data.username)) {
    return new Response("이미 존재하는 아이디입니다.", { status: 409 });
  }
  await kv.put(data.username, JSON.stringify(data));
  return new Response("회원가입 완료", { status: 200 });
}
