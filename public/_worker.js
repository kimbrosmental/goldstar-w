export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/__health") {
      return new Response(JSON.stringify({ ok: true, mode: "ASSETS_ONLY" }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    // Serve static assets only; no API logic
    return env.ASSETS.fetch(request);
  }
};