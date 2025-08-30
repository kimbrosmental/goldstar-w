export async function onRequest({ request, env }) {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  try {
    if (request.method === "GET") {
      // 로그 데이터 조회
      try {
        const raw = await env.LOG.get("access_logs");
        const logs = raw ? JSON.parse(raw) : { data: [] };
        return new Response(JSON.stringify(logs), { status: 200, headers: cors });
      } catch (e) {
        console.error("로그 조회 오류:", e);
        return new Response(JSON.stringify({ data: [] }), { status: 200, headers: cors });
      }
    } 
    else if (request.method === "POST") {
      // 로그 데이터 저장
      const body = await request.json();
      const data = body.data || [];
      
      // 데이터 유효성 검사
      const validatedData = data.map(log => ({
        id: log.id || ('LOG' + Date.now() + Math.random().toString(36).substr(2, 9)),
        ip: log.ip || 'unknown',
        userAgent: log.userAgent || 'unknown',
        timestamp: log.timestamp || new Date().toISOString(),
        page: log.page || 'unknown',
        sessionTime: parseInt(log.sessionTime) || 0,
        referer: log.referer || 'direct',
        country: log.country || 'unknown',
        visitCount: parseInt(log.visitCount) || 1,
        screenResolution: log.screenResolution || 'unknown'
      }));

      await env.LOG.put("access_logs", JSON.stringify({ data: validatedData }));
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: "로그 저장 완료",
        count: validatedData.length 
      }), { 
        status: 200, 
        headers: cors 
      });
    }
    else {
      return new Response(JSON.stringify({ error: "허용되지 않은 메서드" }), { 
        status: 405, 
        headers: cors 
      });
    }
  } catch (e) {
    console.error("로그 API 오류:", e);
    return new Response(JSON.stringify({ 
      error: "서버 오류", 
      message: e.message 
    }), { 
      status: 500, 
      headers: cors 
    });
  }
}
