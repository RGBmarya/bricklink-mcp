import { authorizeRequest } from "./auth.js";
import { BrickLinkAuthError, BrickLinkError, formatApiError } from "./errors.js";
import type {
  ApiResponse,
  BrickLinkClientOptions,
  BrickLinkCredentials,
  QueryParams,
} from "./types.js";

const DEFAULT_BASE_URL = "https://api.bricklink.com/api/store/v1";

function stringifyQuery(params?: QueryParams): Record<string, string> {
  if (!params) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    out[key] = String(value);
  }
  return out;
}

function appendQuery(url: string, query: Record<string, string>): string {
  const keys = Object.keys(query);
  if (!keys.length) return url;
  const qs = keys
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(query[k]!)}`)
    .join("&");
  return `${url}?${qs}`;
}

export class BrickLinkHttpClient {
  readonly credentials: BrickLinkCredentials;
  readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: BrickLinkClientOptions) {
    if (
      !options.credentials?.consumerKey ||
      !options.credentials?.consumerSecret ||
      !options.credentials?.token ||
      !options.credentials?.tokenSecret
    ) {
      throw new BrickLinkAuthError(
        "BrickLink requires consumerKey, consumerSecret, token, and tokenSecret",
      );
    }
    this.credentials = options.credentials;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.fetchImpl = options.fetch ?? fetch;
  }

  async request<T>(
    method: string,
    path: string,
    options: {
      query?: QueryParams;
      body?: unknown;
    } = {},
  ): Promise<T> {
    const query = stringifyQuery(options.query);
    const urlPath = path.startsWith("/") ? path : `/${path}`;
    const url = `${this.baseUrl}${urlPath}`;
    const authHeader = authorizeRequest(method, url, query, this.credentials);
    const fullUrl = appendQuery(url, query);

    const headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: authHeader,
    };

    let body: string | undefined;
    if (options.body !== undefined && options.body !== null) {
      // Official docs mention URL-encoded JSON; BrickLink also accepts application/json.
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(options.body);
    }

    const response = await this.fetchImpl(fullUrl, {
      method: method.toUpperCase(),
      headers,
      body,
    });

    const text = await response.text();
    let parsed: ApiResponse<T> | undefined;
    if (text) {
      try {
        parsed = JSON.parse(text) as ApiResponse<T>;
      } catch {
        throw new BrickLinkError(
          `Invalid JSON response (${response.status}): ${text.slice(0, 200)}`,
          response.status,
          undefined,
          text,
        );
      }
    }

    const meta = parsed?.meta;
    const code = meta ? Number(meta.code) : response.status;
    if (!response.ok || (meta && !(code >= 200 && code < 300))) {
      throw new BrickLinkError(
        formatApiError(meta, `BrickLink API error HTTP ${response.status}`),
        code || response.status,
        meta,
        parsed ?? text,
      );
    }

    return (parsed ? parsed.data : (undefined as T)) as T;
  }

  get<T>(path: string, query?: QueryParams): Promise<T> {
    return this.request<T>("GET", path, { query });
  }

  post<T>(path: string, body?: unknown, query?: QueryParams): Promise<T> {
    return this.request<T>("POST", path, { body, query });
  }

  put<T>(path: string, body?: unknown, query?: QueryParams): Promise<T> {
    return this.request<T>("PUT", path, { body, query });
  }

  delete<T>(path: string, query?: QueryParams): Promise<T> {
    return this.request<T>("DELETE", path, { query });
  }
}
