// api-rewrite.js
// 모든 API 호출을 동일 오리진(/api/*)으로 보냄
(function () {
  // API 엔드포인트 매핑
  const API_MAP = {
    dupcheck: "/api/dupcheck",
    login: "/api/login",
    signup: "/api/signup",
    users: "/api/users",
    orders: "/api/orders",
    inquiries: "/api/inquiries",
    security: "/api/security",
    goldprice: "/api/goldprice",
    iprules: "/api/iprules",
    admins: "/api/admins"
  };

  window.API = {
    post: async function (endpoint, data) {
      const url = API_MAP[endpoint] || endpoint;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      return await res.json().catch(() => null);
    },
    get: async function (endpoint, params) {
      let url = API_MAP[endpoint] || endpoint;
      if (params && typeof params === "object") {
        const query = new URLSearchParams(params).toString();
        if (query) url += (url.includes("?") ? "&" : "?") + query;
      }
      const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      return await res.json().catch(() => null);
    }
  };

  // 🔐 전역 암호화/복호화 유틸 추가
  window.encrypt = async function(obj) {
    try {
      const str = typeof obj === 'string' ? obj : JSON.stringify(obj);
      return btoa(unescape(encodeURIComponent(str)));
    } catch { return obj; }
  };
  window.decrypt = async function(str) {
    try {
      const decoded = decodeURIComponent(escape(atob(str)));
      return JSON.parse(decoded);
    } catch { return str; }
  };

  console.log("[api-rewrite] 적용됨: 모든 API는 동일 오리진(/api/*)으로 호출됩니다.");
})();
