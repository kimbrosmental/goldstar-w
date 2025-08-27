// Admin Security view: always loads + re-syncs after add/update/delete
(function(){
  const API = "/api/security";
  const $ = (sel, p=document) => p.querySelector(sel);
  const $$ = (sel, p=document) => Array.from(p.querySelectorAll(sel));

  let state = {
    goldprice: {},
    admins: [],
    adminid: "",
    ip_rules: []
  };

  async function api(method="GET", type="all", payload) {
    const res = await fetch(`${API}?type=${encodeURIComponent(type)}`, {
      method,
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: method === "GET" ? null : JSON.stringify(payload ?? {}),
    });
    const js = await res.json().catch(()=>({}));
    if (!res.ok || !js?.ok) {
      console.error("API 오류:", js?.error || res.statusText);
      alert("API 오류: " + (js?.error || res.statusText));
      throw new Error(js?.error || res.statusText);
    }
    return js.data;
  }

  async function reload() {
    state = await api("GET", "all");
    render();
    return state;
  }

  // ---------- Render ----------
  function render() {
    const host = document.getElementById("view-security");
    if (!host) return;

    host.innerHTML = `
      <div class="card">
        <h3>오늘의 금시세</h3>
        <div class="row">
          <input id="goldprice-json" class="input" placeholder='{"date":"2025-08-27","price":123.45}'/>
          <button id="btn-gold-save" class="btn">저장</button>
        </div>
        <pre id="goldprice-view" class="pre"></pre>
      </div>

      <div class="card">
        <h3>기본 관리자 ID</h3>
        <div class="row">
          <input id="adminid-input" class="input" placeholder="admin"/>
          <button id="btn-adminid-save" class="btn">저장</button>
          <button id="btn-adminid-clear" class="btn btn-danger">삭제</button>
        </div>
      </div>

      <div class="card">
        <h3>관리자 계정 (전체 교체)</h3>
        <textarea id="admins-json" rows="6" class="input" placeholder='[{"id":"a1","username":"admin","role":"OWNER"}]'></textarea>
        <div class="row">
          <button id="btn-admins-save" class="btn">전체 저장</button>
          <button id="btn-admins-clear" class="btn btn-danger">전체 삭제</button>
        </div>
        <pre id="admins-view" class="pre"></pre>
      </div>

      <div class="card">
        <h3>IP Rules (전체 교체)</h3>
        <textarea id="iprules-json" rows="6" class="input" placeholder='[{"id":"r1","ip":"1.2.3.4","allow":true,"note":"HQ"}]'></textarea>
        <div class="row">
          <button id="btn-iprules-save" class="btn">전체 저장</button>
          <button id="btn-iprules-clear" class="btn btn-danger">전체 삭제</button>
        </div>
        <pre id="iprules-view" class="pre"></pre>
      </div>
      <style>
        #view-security .card { border:1px solid #444; border-radius:12px; padding:16px; margin:16px 0; }
        #view-security .row { display:flex; gap:8px; align-items:center; margin:8px 0; flex-wrap:wrap; }
        #view-security .input { flex:1; min-width:260px; padding:8px; }
        #view-security .btn { padding:8px 12px; cursor:pointer; border-radius:8px; border:1px solid #888; }
        #view-security .btn-danger { background:#5b1a1a; color:#fff; border-color:#5b1a1a; }
        #view-security .pre { background:#111; padding:12px; border-radius:8px; overflow:auto; }
      </style>
    `;

    // Fill values
    $("#goldprice-view", host).textContent = JSON.stringify(state.goldprice ?? {}, null, 2);
    $("#adminid-input", host).value = state.adminid ?? "";
    $("#admins-view", host).textContent = JSON.stringify(state.admins ?? [], null, 2);
    $("#iprules-view", host).textContent = JSON.stringify(state.ip_rules ?? [], null, 2);

    // Bind events
    $("#btn-gold-save", host)?.addEventListener("click", async () => {
      try {
        const raw = $("#goldprice-json", host).value.trim();
        const obj = raw ? JSON.parse(raw) : {};
        state = await api("POST", "goldprice", obj);
        // state is full snapshot
        render();
      } catch (e) {
        alert("금시세 저장 실패: " + e.message);
      }
    });

    $("#btn-adminid-save", host)?.addEventListener("click", async () => {
      try {
        const value = $("#adminid-input", host).value.trim();
        state = await api("POST", "adminid", { value });
        render();
      } catch (e) {
        alert("adminid 저장 실패: " + e.message);
      }
    });

    $("#btn-adminid-clear", host)?.addEventListener("click", async () => {
      if (!confirm("adminid를 삭제할까요?")) return;
      try {
        state = await api("DELETE", "adminid", {});
        render();
      } catch (e) {
        alert("adminid 삭제 실패: " + e.message);
      }
    });

    $("#btn-admins-save", host)?.addEventListener("click", async () => {
      try {
        const raw = $("#admins-json", host).value.trim();
        const arr = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(arr)) throw new Error("admins는 배열이어야 합니다.");
        state = await api("POST", "admins", arr);
        render();
      } catch (e) {
        alert("관리자 저장 실패: " + e.message);
      }
    });

    $("#btn-admins-clear", host)?.addEventListener("click", async () => {
      if (!confirm("관리자 전체를 삭제할까요?")) return;
      try {
        state = await api("DELETE", "admins", {});
        render();
      } catch (e) {
        alert("관리자 삭제 실패: " + e.message);
      }
    });

    $("#btn-iprules-save", host)?.addEventListener("click", async () => {
      try {
        const raw = $("#iprules-json", host).value.trim();
        const arr = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(arr)) throw new Error("ip_rules는 배열이어야 합니다.");
        state = await api("POST", "ip_rules", arr);
        render();
      } catch (e) {
        alert("IP Rules 저장 실패: " + e.message);
      }
    });

    $("#btn-iprules-clear", host)?.addEventListener("click", async () => {
      if (!confirm("IP Rules 전체를 삭제할까요?")) return;
      try {
        state = await api("DELETE", "ip_rules", {});
        render();
      } catch (e) {
        alert("IP Rules 삭제 실패: " + e.message);
      }
    });
  }

  // expose to SPA router
  window.renderSecurity = () => { /* ensure latest from server each time user enters tab */
    reload();
  };

  // initial load if page opened directly without router switching
  document.addEventListener("DOMContentLoaded", reload);
})();
