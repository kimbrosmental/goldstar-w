// kill-rewrite.js — runtime guard to ensure same-origin /api/*
// Place AFTER any legacy api-rewrite.js and BEFORE app.js.
(function(){
  if (typeof window === 'undefined') return;
  var original = (window.__ORIGINAL_FETCH || window.fetch).bind(window);
  // Capture original for future
  window.__ORIGINAL_FETCH = original;
  window.fetch = function(input, init){
    try{
      var req = new Request(input, init);
      var u = new URL(req.url, location.origin);
      // If someone tried to send to *.workers.dev, force back to same-origin /api
      if (u.hostname.endsWith('.workers.dev')){
        var mapped;
        if (u.pathname.startsWith('/api/')) {
          mapped = new URL(u.pathname, location.origin);
        } else {
          // special external endpoints like /price -> map to same path on same origin
          mapped = new URL(u.pathname, location.origin);
        }
        return original(new Request(mapped, {
          method: req.method,
          headers: req.headers,
          body: (req.method==='GET'||req.method==='HEAD') ? undefined : req.body,
          redirect: req.redirect,
          cache: 'no-store',
          credentials: 'same-origin',
          mode: 'same-origin'
        }));
      }
      return original(req);
    }catch(e){
      return original(input, init);
    }
  };
})();
