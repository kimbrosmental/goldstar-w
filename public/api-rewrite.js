// 모든 API 호출을 동일 오리진(/api/*)으로 보냄 + encrypt/decrypt 유틸 제공
(function () {
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
    post: async (endpoint, data) => {
      const url = API_MAP[endpoint] || endpoint;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      return await res.json().catch(() => null);
    },
    get: async (endpoint, params) => {
      let url = API_MAP[endpoint] || endpoint;
      if (params && typeof params === "object") {
        const query = new URLSearchParams(params).toString();
        if (query) url += (url.includes("?") ? "&" : "?") + query;
      }
      const res = await fetch(url, { method: "GET", headers: { "Content-Type": "application/json" } });
      return await res.json().catch(() => null);
    }
  };

  // 간단한 Base64 기반 암호화/복호화
  window.encrypt = obj => btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
  window.decrypt = str => JSON.parse(decodeURIComponent(escape(atob(str))));

  console.log("[api-rewrite] 적용됨: 모든 API는 동일 오리진(/api/*)으로 호출됩니다.");
})();
