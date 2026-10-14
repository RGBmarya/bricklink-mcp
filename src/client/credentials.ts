import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { BrickLinkAuthError } from "./errors.js";
import type { BrickLinkCredentials } from "./types.js";

export interface CredentialSources {
  env?: NodeJS.ProcessEnv;
  configPath?: string;
}

function pick(env: NodeJS.ProcessEnv, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const v = env[key];
    if (v && v.trim()) return v.trim();
  }
  return undefined;
}

function fromEnv(env: NodeJS.ProcessEnv): Partial<BrickLinkCredentials> {
  return {
    consumerKey: pick(env, "BRICKLINK_CONSUMER_KEY", "BL_CONSUMER_KEY"),
    consumerSecret: pick(env, "BRICKLINK_CONSUMER_SECRET", "BL_CONSUMER_SECRET"),
    token: pick(env, "BRICKLINK_TOKEN", "BL_TOKEN", "BRICKLINK_ACCESS_TOKEN"),
    tokenSecret: pick(
      env,
      "BRICKLINK_TOKEN_SECRET",
      "BL_TOKEN_SECRET",
      "BRICKLINK_ACCESS_TOKEN_SECRET",
    ),
  };
}

function fromFile(path: string): Partial<BrickLinkCredentials> {
  if (!existsSync(path)) return {};
  const raw = JSON.parse(readFileSync(path, "utf8")) as Record<string, string>;
  return {
    consumerKey: raw.consumerKey ?? raw.consumer_key,
    consumerSecret: raw.consumerSecret ?? raw.consumer_secret,
    token: raw.token ?? raw.access_token,
    tokenSecret: raw.tokenSecret ?? raw.token_secret ?? raw.access_token_secret,
  };
}

export function defaultConfigPaths(): string[] {
  const home = homedir();
  return [
    join(process.cwd(), ".bricklink.json"),
    join(home, ".config", "bricklink", "credentials.json"),
    join(home, ".bricklink.json"),
  ];
}

/**
 * Resolve credentials from explicit values, env vars, then config files.
 */
export function loadCredentials(
  explicit?: Partial<BrickLinkCredentials>,
  sources: CredentialSources = {},
): BrickLinkCredentials {
  const env = sources.env ?? process.env;
  const envCreds = fromEnv(env);

  let fileCreds: Partial<BrickLinkCredentials> = {};
  const paths = sources.configPath ? [sources.configPath] : defaultConfigPaths();
  for (const p of paths) {
    fileCreds = fromFile(p);
    if (
      fileCreds.consumerKey &&
      fileCreds.consumerSecret &&
      fileCreds.token &&
      fileCreds.tokenSecret
    ) {
      break;
    }
  }

  const merged: BrickLinkCredentials = {
    consumerKey:
      explicit?.consumerKey || envCreds.consumerKey || fileCreds.consumerKey || "",
    consumerSecret:
      explicit?.consumerSecret ||
      envCreds.consumerSecret ||
      fileCreds.consumerSecret ||
      "",
    token: explicit?.token || envCreds.token || fileCreds.token || "",
    tokenSecret:
      explicit?.tokenSecret || envCreds.tokenSecret || fileCreds.tokenSecret || "",
  };

  if (
    !merged.consumerKey ||
    !merged.consumerSecret ||
    !merged.token ||
    !merged.tokenSecret
  ) {
    throw new BrickLinkAuthError(
      "Missing BrickLink credentials. Set BRICKLINK_CONSUMER_KEY, BRICKLINK_CONSUMER_SECRET, BRICKLINK_TOKEN, BRICKLINK_TOKEN_SECRET (or place them in ~/.config/bricklink/credentials.json).",
    );
  }

  return merged;
}
