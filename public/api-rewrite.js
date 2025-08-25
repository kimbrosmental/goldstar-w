// api-rewrite.js — guarded
// Default: NO-OP. Only rewrite when window.USE_EXTERNAL_WORKERS === true.
//
// If enabled, only selected /api/* paths are routed to external Workers.
// Extend ORIGINS as needed.

(function () {
  try {
    if (typeof window === 'undefined') return;
    if (window.USE_EXTERNAL_WORKERS !== true) return; // default OFF

    const ORIGINS = Object.assign({
      '/api/dupcheck': 'https://dupcheck.hanoiosaka1.workers.dev/',
      '/api/login':    'https://login.hanoiosaka1.workers.dev/',
      '/price':        'https://gold-price-proxy.hanoiosaka1.workers.dev/price'
    }, window.API_ORIGINS || {}); // allow overrides

    const originalFetch = window.fetch.bind(window);

    window.fetch = function(input, init) {
      try {
        const req = new Request(input, init);
        const u = new URL(req.url, location.origin);
        const path = u.pathname;

        if (ORIGINS[path]) {
          const target = ORIGINS[path];
          // Clone request while preserving method/headers/body
          const proxyReq = new Request(target, {
            method: req.method,
            headers: req.headers,
            body: (req.method === 'GET' || req.method === 'HEAD') ? undefined : req.body,
            redirect: req.redirect,
            mode: 'cors',
            credentials: 'omit',
            cache: 'no-store'
          });
          return originalFetch(proxyReq);
        }
        return originalFetch(req);
      } catch (e) {
        return originalFetch(input, init);
      }
    };
  } catch {}
})();
