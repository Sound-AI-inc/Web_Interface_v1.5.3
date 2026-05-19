export class HttpError extends Error {
  statusCode: number;
  code: string;

  constructor(statusCode: number, code: string, message = code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function errorStatus(error: unknown): number {
  return error instanceof HttpError ? error.statusCode : 500;
}

export function errorCode(error: unknown): string {
  return error instanceof HttpError ? error.code : "INTERNAL_ERROR";
}
