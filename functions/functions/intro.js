// functions/intro.js
// Proxies the intro GIF from a private Dropbox link stored in environment variable INTRO_GIF_URL
// so the client never sees the Dropbox URL.
// gold-intro.gif Dropbox 직접 프록시
export async function onRequest() {
  const url = 'https://www.dropbox.com/scl/fi/uxylpdl0eyj9ebivrr1db/gold-intro.gif?rlkey=tfs5khgzwo6xsyxkh83u7pj71&raw=1';
  try {
    const res = await fetch(url, { cf: { cacheTtl: 600, cacheEverything: true } });
    if (!res.ok) throw new Error('fetch_fail');
    const headers = new Headers(res.headers);
    headers.set('content-type', 'image/gif');
    headers.set('cache-control', 'public, max-age=600');
    headers.set('x-content-type-options', 'nosniff');
    headers.set('referrer-policy', 'no-referrer');
    headers.set('access-control-allow-origin', '*');
    return new Response(res.body, { status: 200, headers });
  } catch (e) {
    return new Response('intro unavailable', { status: 502 });
  }
}