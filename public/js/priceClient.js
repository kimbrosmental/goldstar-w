// public/js/priceClient.js — 브라우저에서 /price 호출
async function getPrice(endpoint = '/price') {
  const res = await fetch(endpoint, { cache: 'no-store', credentials: 'omit' });
  if (!res.ok) throw new Error('price_fetch_failed:' + res.status);
  return await res.json();
}
function renderPrice(el, data) {
  if (!el) return;
  const price = data?.price ?? '-';
  const percent = data?.percent ?? '-';
  const change = data?.change ?? '-';
  const trend = data?.trend ?? 'flat';
  el.textContent = `${price} (${percent}, ${change} / ${trend})`;
}
export default { getPrice, renderPrice };
export { getPrice, renderPrice };
