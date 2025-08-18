// functions/price.js
export async function onRequest() {
  try {
    const res  = await fetch('https://www.soongumnara.co.kr/', {
      cf: { cacheTtl: 300, cacheEverything: true }
    });
    const html = await res.text();

    const data = extract(html);
    if (!data) throw new Error('parse_fail');

    return json(data);
  } catch (e) {
    return json({
      price: null,
      percent: null,
      trend: 'flat',
    });
  }
}

function extract(html) {
  const priceMatch   = html.match(/id=["']spure["'][^>]*>[\s\S]*?<span[^>]*class=["']counter["'][^>]*>([\d,]+)<\/span>/i);
  const percentMatch = html.match(/id=["']spure["'][^>]*>[\s\S]*?<span[^>]*class=["']per["'][^>]*>([\d.+-]+%)<\/span>/i);
  const isUp         = /id=["']spure["'][\s\S]*?class=["'][^"']*up[^"']*["']/i.test(html);
  const isDown       = /id=["']spure["'][\s\S]*?class=["'][^"']*down[^"']*["']/i.test(html);

  if (!priceMatch || !percentMatch) return null;

  return {
    price: priceMatch[1].replace(/[^0-9,]/g, ''),
    percent: percentMatch[1],
    trend: isUp ? 'up' : (isDown ? 'down' : 'flat')
  };
}

function json(obj) {
  return new Response(JSON.stringify(obj), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*'
    }
  });
}