// functions/price.js
// (선택) KV를 쓰려면 Pages → Settings → Functions → KV Bindings에서 PRICE_CACHE 이름으로 바인딩
export async function onRequest(context) {
  const { env } = context;
  try {
    // 1) 원본 HTML
    const originURL = 'https://www.soongumnara.co.kr/';
    const res = await fetch(originURL, { cf: { cacheTtl: 300, cacheEverything: true } });
    const html = await res.text();

    // 2) 정규식 파싱
    const data = extract(html);
    if (!data) throw new Error('parse_fail');

    // 3) 성공 시 KV 캐시
    if (env.PRICE_CACHE) {
      await env.PRICE_CACHE.put('latest', JSON.stringify(data));
    }

    return json(data);
  } catch (err) {
    // 실패 시 KV fallback
    if (env.PRICE_CACHE) {
      const cached = await env.PRICE_CACHE.get('latest');
      if (cached) return json(JSON.parse(cached));
    }
    // 아무 캐시도 없으면 기본값
    return json({
      price: null,
      percent: null,
      trend: 'flat',
      updatedAt: null
    });
  }
}

// =============== Helper ===============
function extract(html) {
  const priceMatch   = html.match(/id=["']spure["'][^>]*>[\s\S]*?<span[^>]*class=["']counter["'][^>]*>([\d,]+)<\/span>/i);
  const percentMatch = html.match(/id=["']spure["'][^>]*>[\s\S]*?<span[^>]*class=["']per["'][^>]*>([\d.+-]+%)<\/span>/i);
  const isUp         = /id=["']spure["'][\s\S]*?class=["'][^"']*up[^"']*["']/i.test(html);
  const isDown       = /id=["']spure["'][\s\S]*?class=["'][^"']*down[^"']*["']/i.test(html);

  if (!priceMatch || !percentMatch) return null;

  return {
    price: priceMatch[1].replace(/[^0-9,]/g, ''),
    percent: percentMatch[1],
    trend: isUp ? 'up' : (isDown ? 'down' : 'flat'),
    updatedAt: Date.now()
  };
}

function json(obj) {
  return new Response(JSON.stringify(obj), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*'
    }
  });
}
