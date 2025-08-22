export async function onRequest() {
  try {
    const primary = 'https://www.soongumnara.co.kr/main/html.php?htmid=goods/gold_list.html';
    const html = await fetch(primary, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': primary
      },
      cf: { cacheTtl: 180, cacheEverything: false }
    }).then(r => r.text());

    // 아주 느슨한 추출(보조): 숫자와 퍼센트
    const priceM = html.match(/class=["'][^"']*counter[^"']*["'][^>]*>([\d.,]+)<\/span>/i) || html.match(/([\d]{2,3}(?:,\d{3})+)/);
    const perM = html.match(/class=["'][^"']*per[^"']*["'][^>]*>([+\-]?\d+(?:\.\d+)?%)<\/span>/i) || html.match(/([+\-]?\d+(?:\.\d+)?%)/);

    const price = priceM ? String(priceM[1] || priceM[0]).replace(/[^0-9,]/g,'') : null;
    const percent = perM ? (perM[1] || perM[0]) : null;
    let trend = 'flat';
    if (percent) {
      if (/^-/.test(percent)) trend = 'down';
      else if (/^\+/.test(percent)) trend = 'up';
    }

    return new Response(JSON.stringify({ price, percent, trend }), {
      headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' }
    });
  } catch {
    return new Response(JSON.stringify({ price: null, percent: null, trend: 'flat' }), {
      headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' }
    });
  }
}