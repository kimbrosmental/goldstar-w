// functions/video.js
// Streams a Dropbox-hosted video without exposing the Dropbox public URL.
// Configure env.VIDEO_SHARE_TOKEN and pass a short videoId via query to map to real URLs server-side only.
// 영상 프록시: id=v1/v2에 따라 Dropbox 직접 연결
export async function onRequest(context) {
  const { request } = context;
  const urlObj = new URL(request.url);
  const id = urlObj.searchParams.get('id');
  let target = null;
  if(id==='v1') target = 'https://www.dropbox.com/scl/fi/efoo333ngirzngmdrurd4/movie-1.mp4?rlkey=v24nt37cux82nn9aazn261rhv&raw=1';
  if(id==='v2') target = 'https://www.dropbox.com/scl/fi/71q6v1ntaebtudq2ttpwq/movie-2.mp4?rlkey=7xw94d6yho2bcf3b6l4wsarse&raw=1';
  if(!target) return new Response('not found', { status: 404 });
  try{
    const range = request.headers.get('range');
    const hdrs = new Headers();
    if(range) hdrs.set('Range', range);
    const upstream = await fetch(target, { cf: { cacheTtl: 600, cacheEverything: true }, headers: hdrs });
    if(!upstream.ok && upstream.status!==206) return new Response('upstream error', { status: upstream.status||502 });
    const headers = new Headers(upstream.headers);
    headers.set('content-type', headers.get('content-type') || 'video/mp4');
    headers.delete('content-disposition');
    headers.set('cache-control', 'public, max-age=600');
    headers.set('x-content-type-options', 'nosniff');
    headers.set('referrer-policy', 'no-referrer');
    headers.set('accept-ranges', headers.get('accept-ranges') || 'bytes');
    headers.set('access-control-allow-origin', '*');
    const status = upstream.status || (range ? 206 : 200);
    return new Response(upstream.body, { status, headers });
  }catch(e){
    return new Response('error', { status: 502 });
  }
}
