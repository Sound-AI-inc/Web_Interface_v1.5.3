export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const accept = request.headers.get("accept") || "";

    if (url.pathname.startsWith("/api/")) {
      return env.ASSETS.fetch(request);
    }

    const response = await env.ASSETS.fetch(request);

    if (response.status === 404 || response.status === 307 || response.status === 301 || response.status === 308) {
      if (accept.includes("text/html")) {
        const indexResponse = await env.ASSETS.fetch(`${url.origin}/index.html`);
        const newHeaders = new Headers(indexResponse.headers);
        newHeaders.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
        return new Response(indexResponse.body, {
          status: 200,
          headers: newHeaders,
        });
      }
    }

    if (url.pathname === "/" || url.pathname === "/index.html") {
      const newHeaders = new Headers(response.headers);
      newHeaders.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    }

    return response;
  },
};
