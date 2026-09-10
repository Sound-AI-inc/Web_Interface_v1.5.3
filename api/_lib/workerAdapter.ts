import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";

type NodeHandler = (request: IncomingMessage, response: ServerResponse) => Promise<void>;

class CollectingServerResponse {
  statusCode = 200;
  private headers = new Map<string, string>();

  setHeader(name: string, value: string | number | readonly string[]): void {
    this.headers.set(name.toLowerCase(), Array.isArray(value) ? value.join(", ") : String(value));
  }

  getHeader(name: string): string | undefined {
    return this.headers.get(name.toLowerCase());
  }

  end(body?: string | Buffer): void {
    this.body = body ?? "";
  }

  body: string | Buffer = "";
}

function bindProcessEnv(env: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(env)) {
    if (typeof value === "string") {
      process.env[key] = value;
    }
  }
}

async function toIncomingMessage(request: Request): Promise<IncomingMessage> {
  const body = request.body ? Buffer.from(await request.arrayBuffer()) : Buffer.alloc(0);
  const readable = Readable.from([body]) as IncomingMessage;
  const headers: Record<string, string | string[] | undefined> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });
  readable.headers = headers;
  readable.method = request.method;
  readable.url = new URL(request.url).pathname + new URL(request.url).search;
  return readable;
}

export async function runNodeHandler(
  handler: NodeHandler,
  request: Request,
  env: Record<string, unknown>,
): Promise<Response> {
  bindProcessEnv(env);

  const incoming = await toIncomingMessage(request);
  const outgoing = new CollectingServerResponse();

  await handler(incoming, outgoing as unknown as ServerResponse);

  const body = outgoing.body;
  const headers = Object.fromEntries(outgoing.headers.entries());

  return new Response(typeof body === "string" ? body : body, {
    status: outgoing.statusCode,
    headers,
  });
}
