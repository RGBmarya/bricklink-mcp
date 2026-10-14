import { createHmac, randomBytes } from "node:crypto";
import type { BrickLinkCredentials } from "./types.js";

/** RFC 3986 percent-encoding as required by OAuth 1.0. */
export function percentEncode(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (c) =>
    `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function normalizeBaseUrl(url: string): string {
  // OAuth base string uses scheme://host/path without default ports or query/fragment.
  const u = new URL(url);
  const port =
    (u.protocol === "https:" && u.port === "443") ||
    (u.protocol === "http:" && u.port === "80")
      ? ""
      : u.port
        ? `:${u.port}`
        : "";
  return `${u.protocol}//${u.hostname}${port}${u.pathname}`;
}

export function collectOAuthParams(
  credentials: BrickLinkCredentials,
  extras: Record<string, string> = {},
): Record<string, string> {
  return {
    oauth_consumer_key: credentials.consumerKey,
    oauth_nonce: randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: credentials.token,
    oauth_version: "1.0",
    ...extras,
  };
}

/**
 * Build the OAuth 1.0 signature base string and HMAC-SHA1 signature.
 */
export function signRequest(
  method: string,
  url: string,
  oauthParams: Record<string, string>,
  queryParams: Record<string, string>,
  credentials: BrickLinkCredentials,
): string {
  const all: Record<string, string> = { ...queryParams, ...oauthParams };
  const paramString = Object.keys(all)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(all[k]!)}`)
    .join("&");

  const baseString = [
    method.toUpperCase(),
    percentEncode(normalizeBaseUrl(url)),
    percentEncode(paramString),
  ].join("&");

  const signingKey = `${percentEncode(credentials.consumerSecret)}&${percentEncode(
    credentials.tokenSecret,
  )}`;

  return createHmac("sha1", signingKey).update(baseString).digest("base64");
}

export function buildAuthorizationHeader(
  oauthParams: Record<string, string>,
  signature: string,
): string {
  const parts = Object.entries({ ...oauthParams, oauth_signature: signature })
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${percentEncode(k)}="${percentEncode(v)}"`);
  return `OAuth ${parts.join(", ")}`;
}

export function authorizeRequest(
  method: string,
  url: string,
  queryParams: Record<string, string>,
  credentials: BrickLinkCredentials,
): string {
  const oauthParams = collectOAuthParams(credentials);
  const signature = signRequest(method, url, oauthParams, queryParams, credentials);
  return buildAuthorizationHeader(oauthParams, signature);
}
