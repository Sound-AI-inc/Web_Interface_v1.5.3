export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.startsWith("/api/")) {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status !== 404) {
        return assetResponse;
      }
      return new Response(JSON.stringify({ error: "API_NOT_FOUND", path }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const response = await env.ASSETS.fetch(request);

    if (response.status === 404) {
      const accept = request.headers.get("accept") || "";
      if (accept.includes("text/html")) {
        const indexRequest = new Request(`${url.origin}/index.html`, request);
        return env.ASSETS.fetch(indexRequest);
      }
    }

    return response;
  },
};