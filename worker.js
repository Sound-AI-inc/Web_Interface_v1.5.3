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
        const indexResponse = await env.ASSETS.fetch(indexRequest);
        const newHeaders = new Headers(indexResponse.headers);
        newHeaders.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
        return new Response(indexResponse.body, {
          status: indexResponse.status,
          headers: newHeaders,
        });
      }
    }

    if (url.pathname === "/index.html" || url.pathname === "/") {
      const newHeaders = new Headers(response.headers);
      newHeaders.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      return new Response(response.body, {
        status: response.status,
        headers: newHeaders,
      });
    }

    return response;
  },
};
