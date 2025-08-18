export async function onRequestPost(context) {
  const { username, password } = await context.request.json();
  const kv = context.env.USERS;
  const user = await kv.get(username);
  if (!user) return new Response("존재하지 않는 아이디입니다.", { status: 404 });
  const userObj = JSON.parse(user);
  if (userObj.password !== password) return new Response("비밀번호가 일치하지 않습니다.", { status: 401 });
  return new Response("로그인 성공", { status: 200 });
}
