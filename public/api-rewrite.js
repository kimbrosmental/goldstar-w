// Frontend router hotfix
// - No theme/HTML changes except adding this script before app/admin scripts.
// - Rewrites BOTH '/api/*' and 'https://*.workers.dev' endpoints to the correct external workers.
// - Use when Pages Direct Upload can't use _worker.js or static broke.
//
// How it works:
//   window.fetch(...) is wrapped. If the URL matches a key in ROUTES (prefix match),
//   it's replaced with the mapped external worker URL.
//   Otherwise, left as-is.
//
// IMPORTANT: Your Workers must return proper CORS (Access-Control-Allow-Origin) headers.

(function(){
  const ROUTES = [
    // Auth & signup
    { from: "/api/dupcheck",        to: "https://dupcheck.hanoiosaka1.workers.dev" },
    { from: "/api/signup",          to: "https://signup.hanoiosaka1.workers.dev" },
    { from: "/api/login",           to: "https://login.hanoiosaka1.workers.dev" },

    // Users
    { from: "/api/users",           to: "https://users.hanoiosaka1.workers.dev" },
    { from: "/api/admin/users",     to: "https://users.hanoiosaka1.workers.dev" },

    // Orders
    { from: "/api/orders",          to: "https://orders.hanoiosaka1.workers.dev" },
    { from: "/api/admin/orders",    to: "https://orders.hanoiosaka1.workers.dev" },

    // Inquiries
    { from: "/api/inquiries",       to: "https://inquiries.hanoiosaka1.workers.dev" },
    { from: "/api/admin/inquiries", to: "https://inquiries.hanoiosaka1.workers.dev" },

    // Security
    { from: "/api/security",        to: "https://security.hanoiosaka1.workers.dev" },
    { from: "/api/admin/security",  to: "https://security.hanoiosaka1.workers.dev" },

    // Admins
    { from: "/api/admin/admins",    to: "https://admins.hanoiosaka1.workers.dev" },
    { from: "/api/admins",          to: "https://admins.hanoiosaka1.workers.dev" },

    // IP rules
    { from: "/api/iprules",         to: "https://ip-security.hanoiosaka1.workers.dev" },
    { from: "/api/admin/iprules",   to: "https://ip-security.hanoiosaka1.workers.dev" },

    // External-to-external passthrough normalization (covers code hardcoded to workers.dev)
    { from: "https://dupcheck.hanoiosaka1.workers.dev",        to: "https://dupcheck.hanoiosaka1.workers.dev" },
    { from: "https://signup.hanoiosaka1.workers.dev",          to: "https://signup.hanoiosaka1.workers.dev" },
    { from: "https://login.hanoiosaka1.workers.dev",           to: "https://login.hanoiosaka1.workers.dev" },
    { from: "https://users.hanoiosaka1.workers.dev",           to: "https://users.hanoiosaka1.workers.dev" },
    { from: "https://orders.hanoiosaka1.workers.dev",          to: "https://orders.hanoiosaka1.workers.dev" },
    { from: "https://inquiries.hanoiosaka1.workers.dev",       to: "https://inquiries.hanoiosaka1.workers.dev" },
    { from: "https://security.hanoiosaka1.workers.dev",        to: "https://security.hanoiosaka1.workers.dev" },
    { from: "https://admins.hanoiosaka1.workers.dev",          to: "https://admins.hanoiosaka1.workers.dev" },
    { from: "https://ip-security.hanoiosaka1.workers.dev",     to: "https://ip-security.hanoiosaka1.workers.dev" },
  ];

  function mapURL(u) {
    for (const r of ROUTES) {
      if (u === r.from || u.startsWith(r.from + "/")) {
        const orig = new URL(u, location.origin);
        const repl = new URL(r.to + orig.pathname.slice(r.from.length) + orig.search);
        return repl.toString();
      }
      if (u.startsWith(r.from)) {
        return r.to + u.slice(r.from.length);
      }
    }
    return u;
  }

  const origFetch = window.fetch.bind(window);
  window.fetch = function(input, init) {
    try {
      if (typeof input === 'string') {
        input = mapURL(input);
      } else if (input && typeof input.url === 'string') {
        const newUrl = mapURL(input.url);
        if (newUrl !== input.url) {
          input = new Request(newUrl, input);
        }
      }
    } catch (_) {}
    return origFetch(input, init);
  };
})();