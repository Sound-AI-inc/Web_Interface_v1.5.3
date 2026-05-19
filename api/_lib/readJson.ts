import type { IncomingMessage } from "node:http";

export async function readJson<T>(request: IncomingMessage, maxBytes = 32_768): Promise<T> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buffer.byteLength;
    if (totalBytes > maxBytes) {
      throw new Error("REQUEST_TOO_LARGE");
    }
    chunks.push(buffer);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) throw new Error("Request body is required.");

  return JSON.parse(raw) as T;
}
