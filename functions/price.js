// functions/api/price.js
export async function onRequest({ env }) {
  try {
    const upstream = "https://www.soongumnara.co.kr/main/html.php?htmid=goods/gold_list.html";
    const res = await fetch(upstream, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko,en;q=0.9",
      },
      cf: { cacheTtl: 0, cacheEverything: false },
    });

    const html = await res.text();

    // 시세 추출
    const priceMatch = html.match(/class=["'][^"']*counter[^"']*["'][^>]*>([\d,]+)<\/span>/i);
    const percentMatch = html.match(/class=["'][^"']*per[^"']*["'][^>]*>([+\-]?\d+(?:\.\d+)?%)<\/span>/i);
    const isUp = /class=["'][^"']*up[^"']*/i.test(html);
    const isDown = /class=["'][^"']*down[^"']*/i.test(html);

    const price = priceMatch ? priceMatch[1].replace(/[^0-9]/g, "") : null;
    const percent = percentMatch ? percentMatch[1] : null;
    let trend = "flat";
    if (isUp) trend = "up";
    else if (isDown) trend = "down";

    const result = { price, percent, trend };

    // ✅ KV에 저장
    await env.ORDERS.put("goldprice", JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ price: null, percent: null, trend: "flat" }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
}
