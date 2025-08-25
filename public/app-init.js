// GSApp safe init: provides minimal defaults if not already defined
(() => {
  const w = window;
  w.GSApp = w.GSApp || {};

  // Default API base: Cloudflare Pages Functions on same origin
  if (!('apiBase' in w.GSApp)) w.GSApp.apiBase = '/api';

  // Safe getters so code like GSApp.loginId() never crashes
  if (typeof w.GSApp.loginId !== 'function') {
    w.GSApp.loginId = () =>
      document.querySelector('#loginId, #login-id, input[name="loginId"], input[name="id"]')
        ?.value?.trim() || '';
  }
  if (typeof w.GSApp.loginPw !== 'function') {
    w.GSApp.loginPw = () =>
      document.querySelector('#loginPw, #login-pw, input[name="loginPw"], input[name="pw"], input[type="password"]')
        ?.value?.trim() || '';
  }
  if (typeof w.GSApp.signupId !== 'function') {
    w.GSApp.signupId = () =>
      document.querySelector('#signupId, #signup-id, input[name="username"], input[name="id"]')
        ?.value?.trim() || '';
  }
})();
