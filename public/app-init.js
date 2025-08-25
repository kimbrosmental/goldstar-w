
// GSApp safe init
(() => {
  const w = window;
  w.GSApp = w.GSApp || {};
  if (!('apiBase' in w.GSApp)) w.GSApp.apiBase = '/api';
  if (typeof w.GSApp.loginId !== 'function') {
    w.GSApp.loginId = () =>
      document.querySelector('#loginId, #login-id, input[name="loginId"], input[name="id"]')?.value?.trim() || '';
  }
  if (typeof w.GSApp.loginPw !== 'function') {
    w.GSApp.loginPw = () =>
      document.querySelector('#loginPw, #login-pw, input[name="loginPw"], input[name="pw"], input[type="password"]')?.value?.trim() || '';
  }
  if (typeof w.GSApp.signupId !== 'function') {
    w.GSApp.signupId = () =>
      document.querySelector('#signupId, #signup-id, input[name="username"], input[name="id"]')?.value?.trim() || '';
  }
})();
