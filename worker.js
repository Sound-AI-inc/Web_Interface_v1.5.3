export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Route /api/* to Cloudflare Functions (if deployed).
    // The Functions binding is optional — if not present, return 404 for API routes.
    if (path.startsWith("/api/")) {
      try {
        // @ts-expect-error - Functions binding is optional
        if (env.FUNCTIONS) {
          // @ts-expect-error
          return await env.ASSETS.fetch(request);
        }
      } catch {
        // Fall through to 404.
      }
      return new Response(JSON.stringify({ error: "API_NOT_AVAILABLE" }), {
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