export async function onRequest(context) {
  const { env } = context;
  try {
    // KV 네임스페이스 테스트: USERS, ORDERS, SECURITY, INQUIRIES
    const namespaces = [
      { name: 'USERS', kv: env.USERS },
      { name: 'ORDERS', kv: env.ORDERS },
      { name: 'SECURITY', kv: env.SECURITY },
      { name: 'INQUIRIES', kv: env.INQUIRIES }
    ];
    let result = '';
    for (const ns of namespaces) {
      try {
        // 임시 키로 put/get 테스트
        await ns.kv.put('kvtest_key', 'test');
        const value = await ns.kv.get('kvtest_key');
        result += `${ns.name}: 연결됨, 값=${value}\n`;
      } catch (e) {
        result += `${ns.name}: 연결 실패 (${e.message})\n`;
      }
    }
    return new Response(result, { status: 200 });
  } catch (err) {
    return new Response('KV 테스트 중 오류: ' + err.message, { status: 500 });
  }
}
