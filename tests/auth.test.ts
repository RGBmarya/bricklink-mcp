import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  authorizeRequest,
  buildAuthorizationHeader,
  collectOAuthParams,
  percentEncode,
  signRequest,
} from "../src/client/auth.js";

describe("oauth helpers", () => {
  it("percent-encodes reserved characters per RFC3986", () => {
    assert.equal(percentEncode("a b"), "a%20b");
    assert.equal(percentEncode("!*()'"), "%21%2A%28%29%27");
  });

  it("builds a stable HMAC-SHA1 signature", () => {
    const credentials = {
      consumerKey: "consumer",
      consumerSecret: "csecret",
      token: "token",
      tokenSecret: "tsecret",
    };
    const oauthParams = {
      oauth_consumer_key: "consumer",
      oauth_nonce: "nonce123",
      oauth_signature_method: "HMAC-SHA1",
      oauth_timestamp: "1191242096",
      oauth_token: "token",
      oauth_version: "1.0",
    };
    const signature = signRequest(
      "GET",
      "https://api.bricklink.com/api/store/v1/orders",
      oauthParams,
      { direction: "in" },
      credentials,
    );
    assert.equal(typeof signature, "string");
    assert.ok(signature.length > 10);

    // Same inputs → same signature
    const again = signRequest(
      "GET",
      "https://api.bricklink.com/api/store/v1/orders",
      oauthParams,
      { direction: "in" },
      credentials,
    );
    assert.equal(signature, again);
  });

  it("produces an Authorization header with all oauth fields", () => {
    const header = buildAuthorizationHeader(
      {
        oauth_consumer_key: "k",
        oauth_nonce: "n",
        oauth_signature_method: "HMAC-SHA1",
        oauth_timestamp: "1",
        oauth_token: "t",
        oauth_version: "1.0",
      },
      "sig=",
    );
    assert.match(header, /^OAuth /);
    assert.match(header, /oauth_signature=/);
    assert.match(header, /oauth_consumer_key=/);
  });

  it("authorizeRequest returns a usable header", () => {
    const header = authorizeRequest(
      "GET",
      "https://api.bricklink.com/api/store/v1/colors",
      {},
      {
        consumerKey: "ck",
        consumerSecret: "cs",
        token: "tk",
        tokenSecret: "ts",
      },
    );
    assert.match(header, /^OAuth /);
  });

  it("collectOAuthParams includes required keys", () => {
    const params = collectOAuthParams({
      consumerKey: "ck",
      consumerSecret: "cs",
      token: "tk",
      tokenSecret: "ts",
    });
    assert.equal(params.oauth_consumer_key, "ck");
    assert.equal(params.oauth_token, "tk");
    assert.equal(params.oauth_signature_method, "HMAC-SHA1");
    assert.equal(params.oauth_version, "1.0");
    assert.ok(params.oauth_nonce);
    assert.ok(params.oauth_timestamp);
  });
});
