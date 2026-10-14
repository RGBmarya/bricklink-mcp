import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BrickLinkClient } from "../src/client/bricklink.js";
import { BrickLinkError } from "../src/client/errors.js";

function mockFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    return handler(url, init);
  }) as typeof fetch;
}

const credentials = {
  consumerKey: "ck",
  consumerSecret: "cs",
  token: "tk",
  tokenSecret: "ts",
};

describe("BrickLinkClient", () => {
  it("lists orders and signs Authorization header", async () => {
    let seenAuth = "";
    let seenUrl = "";
    const client = new BrickLinkClient({
      credentials,
      fetch: mockFetch((url, init) => {
        seenUrl = url;
        seenAuth = String(init?.headers && (init.headers as Record<string, string>).Authorization);
        return new Response(
          JSON.stringify({
            meta: { code: 200, message: "OK", description: "OK" },
            data: [{ order_id: 1, status: "PENDING" }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }),
    });

    const orders = await client.orders.list({ direction: "out" });
    assert.equal(orders[0]?.order_id, 1);
    assert.match(seenUrl, /direction=out/);
    assert.match(seenAuth, /^OAuth /);
  });

  it("creates inventory with JSON body", async () => {
    let method = "";
    let body = "";
    const client = new BrickLinkClient({
      credentials,
      fetch: mockFetch((_url, init) => {
        method = init?.method ?? "";
        body = String(init?.body ?? "");
        return new Response(
          JSON.stringify({
            meta: { code: 201, message: "OK_CREATED", description: "OK" },
            data: { inventory_id: 99, quantity: 5, unit_price: "1.0000", item: { no: "3001", type: "PART" } },
          }),
          { status: 201 },
        );
      }),
    });

    const lot = await client.inventories.create({
      item: { no: "3001", type: "PART" },
      color_id: 5,
      quantity: 5,
      unit_price: "1.00",
      new_or_used: "N",
    });
    assert.equal(method, "POST");
    assert.equal(lot.inventory_id, 99);
    assert.match(body, /"no":"3001"/);
  });

  it("throws BrickLinkError on API failure meta", async () => {
    const client = new BrickLinkClient({
      credentials,
      fetch: mockFetch(() =>
        new Response(
          JSON.stringify({
            meta: {
              code: 404,
              message: "RESOURCE_NOT_FOUND",
              description: "missing",
            },
            data: null,
          }),
          { status: 404 },
        ),
      ),
    });

    await assert.rejects(
      () => client.catalog.getItem("PART", "nope"),
      (err: unknown) => {
        assert.ok(err instanceof BrickLinkError);
        assert.equal(err.status, 404);
        return true;
      },
    );
  });

  it("updates order status with field/value patch", async () => {
    let body = "";
    const client = new BrickLinkClient({
      credentials,
      fetch: mockFetch((_url, init) => {
        body = String(init?.body ?? "");
        return new Response(
          JSON.stringify({
            meta: { code: 204, message: "OK_NO_CONTENT", description: "OK" },
            data: null,
          }),
          { status: 200 },
        );
      }),
    });

    await client.orders.updateStatus(123, "SHIPPED");
    assert.deepEqual(JSON.parse(body), { field: "status", value: "SHIPPED" });
  });

  it("gets price guide with query params", async () => {
    let seenUrl = "";
    const client = new BrickLinkClient({
      credentials,
      fetch: mockFetch((url) => {
        seenUrl = url;
        return new Response(
          JSON.stringify({
            meta: { code: 200, message: "OK", description: "OK" },
            data: {
              item: { no: "3001", type: "PART" },
              min_price: "0.10",
              max_price: "1.00",
              avg_price: "0.50",
            },
          }),
          { status: 200 },
        );
      }),
    });

    const guide = await client.catalog.getPriceGuide("PART", "3001", {
      guide_type: "sold",
      new_or_used: "U",
      color_id: 11,
    });
    assert.equal(guide.avg_price, "0.50");
    assert.match(seenUrl, /guide_type=sold/);
    assert.match(seenUrl, /new_or_used=U/);
    assert.match(seenUrl, /color_id=11/);
  });
});
