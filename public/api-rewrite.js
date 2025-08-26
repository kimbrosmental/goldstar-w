// api-rewrite.js
// 모든 API 호출을 동일 오리진(/api/*)으로 보냄
// 외부 *.workers.dev 주소 사용 제거

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
    iprules: "/api/iprules"
  };

  // window.API 호출 함수 재정의
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

  console.log("[api-rewrite] 적용됨: 모든 API는 동일 오리진(/api/*)으로 호출됩니다.");
})();
