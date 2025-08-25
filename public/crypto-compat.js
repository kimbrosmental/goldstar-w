
// crypto-compat: provide minimal window.encrypt/decrypt used by admin pages
(function(){
  if (typeof window==='undefined') return;
  window.encrypt = async function(obj){ try { return JSON.stringify(obj); } catch { return ''; } };
  window.decrypt = async function(data){ try { return typeof data==='string' ? JSON.parse(data) : data; } catch { return []; } };
})();
