export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const asset = await env.ASSETS.fetch(request);
    if (asset.status !== 404) {
      return asset;
    }

    const indexUrl = new URL("/index.html", url.origin);
    if (url.search) {
      indexUrl.search = url.search;
    }
    if (url.hash) {
      indexUrl.hash = url.hash;
    }

    return env.ASSETS.fetch(
      new Request(indexUrl, request),
    );
  },
};
