export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.pathname.includes('.')) {
    return context.next();
  }

  const indexUrl = new URL('/index.html', url.origin);
  return await fetch(indexUrl, {
    headers: context.request.headers,
  });
}
