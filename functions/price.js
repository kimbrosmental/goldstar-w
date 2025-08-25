// functions/price.js — 순금(24k-3.75g) 가격/퍼센트/변동금액
export async function onRequest() {
  try {
    const naraUrl = 'https://www.soongumnara.co.kr/main/html.php?htmid=goods/gold_list.html';
    const naraHtml = await fetchText(naraUrl);
    const nara = extractFromSoongumNara(naraHtml);
    if (nara) return json(nara);

    const fallbacks = [
      'https://jongro.koreagoldx.co.kr/',
      'https://songpa.koreagoldx.co.kr/',
      'https://nonhyeon.koreagoldx.co.kr/',
      'https://youngjongdo.koreagoldx.co.kr/',
    ];
    for (const url of fallbacks) {
      const html = await fetchText(url);
      const got = extractFromKoreaGoldX(html);
      if (got) return json(got);
    }
    return json({ price: null, percent: null, change: null, trend: 'flat' });
  } catch {
    return json({ price: null, percent: null, change: null, trend: 'flat' });
  }
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Referer': url
    },
    cf: { cacheTtl: 120, cacheEverything: false }
  });
  return await res.text();
}
function json(obj){ return new Response(JSON.stringify(obj), { headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' } }); }
function onlyDigitsComma(s){ return String(s||'').replace(/[^0-9,]/g,''); }
function toInt(numStr){ const n = parseInt(String(numStr||'').replace(/,/g,''),10); return Number.isFinite(n)?n:null; }
function formatKR(n){ return Number.isFinite(n)? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : null; }

function extractFromSoongumNara(html) {
  if (!html) return null;
  let scope = html;
  const block = html.match(/id=["']spure["'][\s\S]{0,4000}?<\/(section|div)>/i);
  if (block) scope = block[0];
  const priceM =
    scope.match(/class=["'][^"']*counter[^"']*["'][^>]*>([\d.,]+)<\/span>/i) ||
    scope.match(/([\d]{2,3}(?:,\d{3})+)/);
  const perM =
    scope.match(/class=["'][^"']*per[^"']*["'][^>]*>([+\-]?\d+(?:\.\d+)?%)<\/span>/i) ||
    scope.match(/([+\-]?\d+(?:\.\d+)?%)/);
  let changeM = null;
  if (perM) {
    const idx = scope.indexOf(perM[0]);
    if (idx >= 0) {
      const tail = scope.slice(idx, idx + 120);
      changeM = tail.match(/%\s*([+\-]?\d{1,3}(?:,\d{3})*)/);
    }
  }
  if (!changeM) changeM = scope.match(/([+\-]?\d{1,3}(?:,\d{3})*)\s*(?:원)?/);

  const price = priceM ? onlyDigitsComma(priceM[1] || priceM[0]) : null;
  const percent = perM ? (perM[1] || perM[0]) : null;
  const changeStr = changeM ? onlyDigitsComma(changeM[1] || changeM[0]) : null;

  if (!price && !percent) return null;

  let trend = 'flat';
  const chg = toInt(changeStr);
  if (percent && /^-/.test(percent)) trend = 'down';
  else if (percent && /^\+/.test(percent)) trend = 'up';
  else if (Number.isFinite(chg)) trend = chg > 0 ? 'up' : (chg < 0 ? 'down' : 'flat');

  return { price: price || null, percent: percent || null, change: chg != null ? formatKR(chg) : null, trend };
}

function extractFromKoreaGoldX(html) {
  if (!html) return null;
  const re = /Gold24k-3\.75g[\s\S]{0,120}?([\d,]{3,})\s*([+\-]?\d+(?:\.\d+)?%)\s*([+\-]?\d{1,3}(?:,\d{3})*)/i;
  const m = html.match(re);
  if (!m) return null;
  const price = onlyDigitsComma(m[1]);
  const percent = m[2];
  const changeStr = onlyDigitsComma(m[3]);
  const chg = toInt(changeStr);
  let trend = 'flat';
  if (percent && /^-/.test(percent)) trend = 'down';
  else if (percent && /^\+/.test(percent)) trend = 'up';
  else if (Number.isFinite(chg)) trend = chg > 0 ? 'up' : (chg < 0 ? 'down' : 'flat');
  return { price, percent, change: chg != null ? formatKR(chg) : null, trend };
}
