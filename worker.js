export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const asset = await env.ASSETS.fetch(request);
    if (asset.status !== 404) {
      return asset;
    }

    return env.ASSETS.fetch(
      new Request(new URL("/index.html", url.origin), request),
    );
  },
};
