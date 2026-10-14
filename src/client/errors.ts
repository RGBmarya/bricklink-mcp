import type { ApiMeta } from "./types.js";

export class BrickLinkError extends Error {
  readonly status: number;
  readonly meta?: ApiMeta;
  readonly body?: unknown;

  constructor(message: string, status: number, meta?: ApiMeta, body?: unknown) {
    super(message);
    this.name = "BrickLinkError";
    this.status = status;
    this.meta = meta;
    this.body = body;
  }
}

export class BrickLinkAuthError extends BrickLinkError {
  constructor(message = "Missing BrickLink OAuth credentials") {
    super(message, 401);
    this.name = "BrickLinkAuthError";
  }
}

export function formatApiError(meta: ApiMeta | undefined, fallback: string): string {
  if (!meta) return fallback;
  const parts = [meta.message, meta.description].filter(Boolean);
  return parts.length ? parts.join(": ") : fallback;
}
