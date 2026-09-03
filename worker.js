export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    const response = await env.ASSETS.fetch(request);

    if (response.status === 404) {
      const path = url.pathname;

      if (path.startsWith("/api/")) {
        return response;
      }

      const accept = request.headers.get("accept") || "";
      if (accept.includes("text/html")) {
        const indexRequest = new Request(`${url.origin}/index.html`, request);
        return env.ASSETS.fetch(indexRequest);
      }
    }

    return response;
  },
};
