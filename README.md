# bricklink-mcp

TypeScript **API client**, **CLI**, and **MCP server** for the [BrickLink Store API](https://www.bricklink.com/v3/api.page). Agents and scripts can act as both **producer (seller)** and **consumer (buyer)** within everything BrickLink exposes over the official API.

> **API limit:** BrickLink does not allow placing cart/checkout purchases via API. Buyers can research catalog/price guides, view placed orders (`direction=out`), leave feedback, and manage received coupons. Sellers get full inventory, inbound order fulfillment, coupons, and related tooling.

## Install

```bash
npm install
npm run build
```

Global-style usage after build:

```bash
node dist/cli/index.js --help
node dist/mcp/server.js
```

Or link bins from `package.json`: `bricklink` and `bricklink-mcp`.

## Credentials

Create an API consumer and IP-bound access token at [BrickLink API registration](https://www.bricklink.com/v2/api/register_consumer.page). Tokens are tied to registered static IPs.

Set environment variables:

```bash
export BRICKLINK_CONSUMER_KEY=...
export BRICKLINK_CONSUMER_SECRET=...
export BRICKLINK_TOKEN=...
export BRICKLINK_TOKEN_SECRET=...
```

Or write `~/.config/bricklink/credentials.json`:

```json
{
  "consumerKey": "...",
  "consumerSecret": "...",
  "token": "...",
  "tokenSecret": "..."
}
```

## Library

```ts
import { BrickLinkClient } from "bricklink-mcp";

const bl = BrickLinkClient.fromEnv();

// Consumer research
const part = await bl.catalog.getItem("PART", "3001");
const prices = await bl.catalog.getPriceGuide("PART", "3001", {
  guide_type: "sold",
  new_or_used: "N",
  color_id: 11,
});
const placed = await bl.orders.list({ direction: "out" });

// Producer fulfillment
const inbound = await bl.orders.list({ direction: "in", status: "-PURGED" });
await bl.inventories.create({
  item: { no: "3001", type: "PART" },
  color_id: 11,
  quantity: 50,
  unit_price: "0.15",
  new_or_used: "N",
});
await bl.orders.updateStatus(inbound[0]!.order_id, "PACKED");
```

### API surface

| Area | Operations |
| --- | --- |
| **Orders** | list (in/out), get, items, messages, feedback, update, status, payment status, drive-thru email |
| **Inventories** | list, get, create, create-many, update (`+/-` qty), delete |
| **Catalog** | item, supersets, subsets (part-out), price guide |
| **Feedback** | list, get, post, reply |
| **Colors / Categories** | list + get |
| **Coupons** | list, get, create, update, delete |
| **Notifications** | list unread |
| **Settings** | shipping methods |
| **Members** | ratings + private notes CRUD |
| **Item mapping** | ElementID ↔ catalog number |

Auth is OAuth 1.0a (HMAC-SHA1) against `https://api.bricklink.com/api/store/v1`.

## CLI

```bash
# Smoke-test credentials
bricklink ping

# Consumer
bricklink catalog item PART 3001
bricklink catalog price PART 3001 --guide-type sold --condition N --color-id 11
bricklink orders list --direction out

# Producer
bricklink orders list --direction in --status -PURGED
bricklink orders get 123456
bricklink orders status 123456 SHIPPED
bricklink orders update 123456 --json '{"shipping":{"tracking_no":"1Z..."}}'
bricklink inventory list --item-type PART --status Y
bricklink inventory create --json '{"item":{"no":"3001","type":"PART"},"color_id":11,"quantity":10,"unit_price":"0.12","new_or_used":"N"}'
bricklink inventory update 999 --json '{"quantity":"+5","unit_price":"0.14"}'
```

## MCP server

Stdio MCP server for Cursor / Claude / other MCP hosts:

```json
{
  "mcpServers": {
    "bricklink": {
      "command": "node",
      "args": ["/absolute/path/to/bricklink-mcp/dist/mcp/server.js"],
      "env": {
        "BRICKLINK_CONSUMER_KEY": "...",
        "BRICKLINK_CONSUMER_SECRET": "...",
        "BRICKLINK_TOKEN": "...",
        "BRICKLINK_TOKEN_SECRET": "..."
      }
    }
  }
}
```

Tools are prefixed `bricklink_*` (e.g. `bricklink_list_orders`, `bricklink_create_inventory`, `bricklink_get_price_guide`). See `src/mcp/server.ts` for the full tool list and schemas.

### Agent roles

| Role | Typical tools |
| --- | --- |
| **Producer / seller** | inventories CRUD, inbound orders, status/shipping/payment updates, drive-thru, coupons out, notifications, shipping methods, member notes |
| **Consumer / buyer** | catalog + price guides, subsets/supersets, element mapping, outbound orders, feedback post, coupons in, member ratings |

## Scripts

```bash
npm run build
npm test
npm run typecheck
npm run dev:cli -- ping
npm run dev:mcp
```

## License

MIT
