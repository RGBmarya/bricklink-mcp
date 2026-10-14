#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { BrickLinkClient } from "../client/bricklink.js";
import { BrickLinkError } from "../client/errors.js";

function getClient(): BrickLinkClient {
  return BrickLinkClient.fromEnv();
}

function ok(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function fail(err: unknown) {
  const message =
    err instanceof BrickLinkError
      ? JSON.stringify({ error: err.message, status: err.status, meta: err.meta }, null, 2)
      : err instanceof Error
        ? err.message
        : String(err);
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true,
  };
}

const itemType = z
  .string()
  .describe(
    "Catalog item type: MINIFIG, PART, SET, BOOK, GEAR, CATALOG, INSTRUCTION, UNSORTED_LOT, ORIGINAL_BOX",
  );

const direction = z.enum(["in", "out"]).describe("in = received, out = placed/created");

function registerTools(server: McpServer): void {
  // —— Catalog ——
  server.tool(
    "bricklink_get_item",
    "Get BrickLink catalog details for an item (PART/SET/MINIFIG/...).",
    { type: itemType, no: z.string().describe("Item number, e.g. 3001 or 75192-1") },
    async ({ type, no }) => {
      try {
        return ok(await getClient().catalog.getItem(type, no));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.tool(
    "bricklink_get_supersets",
    "List catalog items that include the specified item.",
    {
      type: itemType,
      no: z.string(),
      color_id: z.number().int().optional(),
    },
    async ({ type, no, color_id }) => {
      try {
        return ok(await getClient().catalog.getSupersets(type, no, color_id));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.tool(
    "bricklink_get_subsets",
    "Part-out: list items included in a set/item.",
    {
      type: itemType,
      no: z.string(),
      color_id: z.number().int().optional(),
      box: z.boolean().optional(),
      instruction: z.boolean().optional(),
      break_minifigs: z.boolean().optional(),
      break_subsets: z.boolean().optional(),
    },
    async (args) => {
      try {
        return ok(
          await getClient().catalog.getSubsets(args.type, args.no, {
            color_id: args.color_id,
            box: args.box,
            instruction: args.instruction,
            break_minifigs: args.break_minifigs,
            break_subsets: args.break_subsets,
          }),
        );
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.tool(
    "bricklink_get_price_guide",
    "Get price statistics (current stock or last-6-months sold).",
    {
      type: itemType,
      no: z.string(),
      color_id: z.number().int().optional(),
      guide_type: z.enum(["sold", "stock"]).optional(),
      new_or_used: z.enum(["N", "U"]).optional(),
      country_code: z.string().optional(),
      region: z.string().optional(),
      currency_code: z.string().optional(),
    },
    async (args) => {
      try {
        return ok(
          await getClient().catalog.getPriceGuide(args.type, args.no, {
            color_id: args.color_id,
            guide_type: args.guide_type,
            new_or_used: args.new_or_used,
            country_code: args.country_code,
            region: args.region,
            currency_code: args.currency_code,
          }),
        );
      } catch (e) {
        return fail(e);
      }
    },
  );

  // —— Orders ——
  server.tool(
    "bricklink_list_orders",
    "List orders. Use direction=in for seller (received) or direction=out for buyer (placed).",
    {
      direction: direction.optional(),
      status: z
        .string()
        .optional()
        .describe("Comma-separated statuses; prefix with - to exclude, e.g. -PURGED"),
      filed: z.boolean().optional(),
    },
    async (args) => {
      try {
        return ok(await getClient().orders.list(args));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.tool(
    "bricklink_get_order",
    "Get full details for one order.",
    { order_id: z.number().int() },
    async ({ order_id }) => {
      try {
        return ok(await getClient().orders.get(order_id));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.tool(
    "bricklink_get_order_items",
    "Get line items for an order (batched arrays).",
    { order_id: z.number().int() },
    async ({ order_id }) => {
      try {
        return ok(await getClient().orders.getItems(order_id));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.tool(
    "bricklink_get_order_messages",
    "Get messages on an order.",
    { order_id: z.number().int() },
    async ({ order_id }) => {
      try {
        return ok(await getClient().orders.getMessages(order_id));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.tool(
    "bricklink_get_order_feedback",
    "Get feedback associated with an order.",
    { order_id: z.number().int() },
    async ({ order_id }) => {
      try {
        return ok(await getClient().orders.getFeedback(order_id));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.tool(
    "bricklink_update_order",
    "Update shipping, costs, remarks, or filed flag on an order (seller).",
    {
      order_id: z.number().int(),
      shipping: z
        .object({
          date_shipped: z.string().optional(),
          tracking_no: z.string().optional(),
          tracking_link: z.string().optional(),
          method_id: z.number().int().optional(),
        })
        .optional(),
      cost: z
        .object({
          shipping: z.union([z.string(), z.number()]).optional(),
          insurance: z.union([z.string(), z.number()]).optional(),
          credit: z.union([z.string(), z.number()]).optional(),
          etc1: z.union([z.string(), z.number()]).optional(),
          etc2: z.union([z.string(), z.number()]).optional(),
        })
        .optional(),
      is_filed: z.boolean().optional(),
      remarks: z.string().optional(),
    },
    async ({ order_id, ...body }) => {
      try {
        return ok(await getClient().orders.update(order_id, body));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.tool(
    "bricklink_update_order_status",
    "Update order status (PENDING, PACKED, SHIPPED, COMPLETED, CANCELLED, ...).",
    {
      order_id: z.number().int(),
      status: z.string(),
    },
    async ({ order_id, status }) => {
      try {
        return ok(await getClient().orders.updateStatus(order_id, status));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.tool(
    "bricklink_update_payment_status",
    "Update payment status on an order (e.g. Received). Buyer-side Received is for outgoing orders.",
    {
      order_id: z.number().int(),
      payment_status: z.string(),
    },
    async ({ order_id, payment_status }) => {
      try {
        return ok(await getClient().orders.updatePaymentStatus(order_id, payment_status));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.tool(
    "bricklink_send_drive_thru",
    'Send "Thank You, Drive Thru!" email to the buyer.',
    {
      order_id: z.number().int(),
      mail_me: z.boolean().optional(),
    },
    async ({ order_id, mail_me }) => {
      try {
        return ok(await getClient().orders.sendDriveThru(order_id, Boolean(mail_me)));
      } catch (e) {
        return fail(e);
      }
    },
  );

  // —— Inventories ——
  server.tool(
    "bricklink_list_inventories",
    "List your store inventory lots (seller/producer).",
    {
      item_type: z.string().optional(),
      status: z.string().optional().describe("Y/S/B/C/N/R; comma-separated; - to exclude"),
      category_id: z.union([z.string(), z.number()]).optional(),
      color_id: z.union([z.string(), z.number()]).optional(),
    },
    async (args) => {
      try {
        return ok(await getClient().inventories.list(args));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.tool(
    "bricklink_get_inventory",
    "Get one inventory lot by inventory_id.",
    { inventory_id: z.number().int() },
    async ({ inventory_id }) => {
      try {
        return ok(await getClient().inventories.get(inventory_id));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.tool(
    "bricklink_create_inventory",
    "Create a new store inventory lot.",
    {
      item_no: z.string(),
      item_type: itemType,
      color_id: z.number().int(),
      quantity: z.number().int(),
      unit_price: z.union([z.string(), z.number()]),
      new_or_used: z.enum(["N", "U"]),
      completeness: z.enum(["C", "B", "S"]).optional(),
      description: z.string().optional(),
      remarks: z.string().optional(),
      bulk: z.number().int().optional(),
      is_retain: z.boolean().optional(),
      is_stock_room: z.boolean().optional(),
      stock_room_id: z.enum(["A", "B", "C"]).optional(),
      my_cost: z.union([z.string(), z.number()]).optional(),
      sale_rate: z.number().optional(),
    },
    async (args) => {
      try {
        return ok(
          await getClient().inventories.create({
            item: { no: args.item_no, type: args.item_type },
            color_id: args.color_id,
            quantity: args.quantity,
            unit_price: args.unit_price,
            new_or_used: args.new_or_used,
            completeness: args.completeness,
            description: args.description,
            remarks: args.remarks,
            bulk: args.bulk,
            is_retain: args.is_retain,
            is_stock_room: args.is_stock_room,
            stock_room_id: args.stock_room_id,
            my_cost: args.my_cost,
            sale_rate: args.sale_rate,
          }),
        );
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.tool(
    "bricklink_create_inventories",
    "Create multiple inventory lots in one request. Pass an array of lot objects.",
    {
      lots: z.array(
        z.object({
          item: z.object({ no: z.string(), type: z.string() }),
          color_id: z.number().int(),
          quantity: z.number().int(),
          unit_price: z.union([z.string(), z.number()]),
          new_or_used: z.enum(["N", "U"]),
          completeness: z.enum(["C", "B", "S"]).optional(),
          description: z.string().optional(),
          remarks: z.string().optional(),
          bulk: z.number().int().optional(),
          is_retain: z.boolean().optional(),
          is_stock_room: z.boolean().optional(),
          stock_room_id: z.enum(["A", "B", "C"]).optional(),
        }),
      ),
    },
    async ({ lots }) => {
      try {
        return ok(await getClient().inventories.createMany(lots));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.tool(
    "bricklink_update_inventory",
    "Update a lot. Quantity changes must be relative strings like '+5' or '-2' (not absolute).",
    {
      inventory_id: z.number().int(),
      quantity: z
        .union([z.string(), z.number()])
        .optional()
        .describe("Relative only, e.g. '+5' or '-2'"),
      unit_price: z.union([z.string(), z.number()]).optional(),
      new_or_used: z.enum(["N", "U"]).optional(),
      completeness: z.enum(["C", "B", "S"]).optional(),
      description: z.string().optional(),
      remarks: z.string().optional(),
      bulk: z.number().int().optional(),
      is_retain: z.boolean().optional(),
      is_stock_room: z.boolean().optional(),
      stock_room_id: z.enum(["A", "B", "C"]).optional(),
      my_cost: z.union([z.string(), z.number()]).optional(),
      sale_rate: z.number().optional(),
    },
    async ({ inventory_id, ...body }) => {
      try {
        return ok(await getClient().inventories.update(inventory_id, body));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.tool(
    "bricklink_delete_inventory",
    "Delete an inventory lot.",
    { inventory_id: z.number().int() },
    async ({ inventory_id }) => {
      try {
        return ok(await getClient().inventories.delete(inventory_id));
      } catch (e) {
        return fail(e);
      }
    },
  );

  // —— Feedback ——
  server.tool(
    "bricklink_list_feedback",
    "List feedback received (in) or posted (out).",
    { direction: direction.optional() },
    async ({ direction: dir }) => {
      try {
        return ok(await getClient().feedback.list(dir ?? "in"));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.tool(
    "bricklink_get_feedback",
    "Get one feedback entry.",
    { feedback_id: z.number().int() },
    async ({ feedback_id }) => {
      try {
        return ok(await getClient().feedback.get(feedback_id));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.tool(
    "bricklink_post_feedback",
    "Post feedback on a completed order. rating: 0=praise, 1=neutral, 2=complaint.",
    {
      order_id: z.number().int(),
      rating: z.number().int().min(0).max(2),
      comment: z.string(),
    },
    async (args) => {
      try {
        return ok(await getClient().feedback.create(args));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.tool(
    "bricklink_reply_feedback",
    "Reply to feedback you received.",
    {
      feedback_id: z.number().int(),
      reply: z.string(),
    },
    async ({ feedback_id, reply }) => {
      try {
        return ok(await getClient().feedback.reply(feedback_id, reply));
      } catch (e) {
        return fail(e);
      }
    },
  );

  // —— Colors / Categories ——
  server.tool("bricklink_list_colors", "List all BrickLink colors.", {}, async () => {
    try {
      return ok(await getClient().colors.list());
    } catch (e) {
      return fail(e);
    }
  });

  server.tool(
    "bricklink_get_color",
    "Get one color by id.",
    { color_id: z.number().int() },
    async ({ color_id }) => {
      try {
        return ok(await getClient().colors.get(color_id));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.tool("bricklink_list_categories", "List all BrickLink categories.", {}, async () => {
    try {
      return ok(await getClient().categories.list());
    } catch (e) {
      return fail(e);
    }
  });

  server.tool(
    "bricklink_get_category",
    "Get one category by id.",
    { category_id: z.number().int() },
    async ({ category_id }) => {
      try {
        return ok(await getClient().categories.get(category_id));
      } catch (e) {
        return fail(e);
      }
    },
  );

  // —— Coupons ——
  server.tool(
    "bricklink_list_coupons",
    "List coupons you created (out) or received (in).",
    {
      direction: direction.optional(),
      status: z.string().optional().describe("O/S/D/E; comma-separated; - to exclude"),
    },
    async (args) => {
      try {
        return ok(await getClient().coupons.list(args));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.tool(
    "bricklink_get_coupon",
    "Get one coupon.",
    { coupon_id: z.number().int() },
    async ({ coupon_id }) => {
      try {
        return ok(await getClient().coupons.get(coupon_id));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.tool(
    "bricklink_create_coupon",
    "Create a store coupon for a buyer. discount_type: F=fixed, S=percentage of shipping?, P=percentage.",
    {
      buyer_name: z.string(),
      discount_type: z.string(),
      discount_amount: z.union([z.string(), z.number()]).optional(),
      discount_rate: z.number().optional(),
      max_discount_amount: z.union([z.string(), z.number()]).optional(),
      currency_code: z.string().optional(),
      remarks_from_seller: z.string().optional(),
      date_expire: z.string().optional(),
      applies_to: z.string().optional(),
      except_on: z.string().optional(),
      is_buyer_restricted: z.boolean().optional(),
    },
    async (args) => {
      try {
        return ok(await getClient().coupons.create(args));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.tool(
    "bricklink_update_coupon",
    "Update an existing coupon. Pass coupon_id plus fields to change.",
    {
      coupon_id: z.number().int(),
      discount_type: z.string().optional(),
      discount_amount: z.union([z.string(), z.number()]).optional(),
      discount_rate: z.number().optional(),
      max_discount_amount: z.union([z.string(), z.number()]).optional(),
      remarks_from_seller: z.string().optional(),
      date_expire: z.string().optional(),
      applies_to: z.string().optional(),
      except_on: z.string().optional(),
    },
    async ({ coupon_id, ...body }) => {
      try {
        return ok(await getClient().coupons.update(coupon_id, body));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.tool(
    "bricklink_delete_coupon",
    "Delete a coupon.",
    { coupon_id: z.number().int() },
    async ({ coupon_id }) => {
      try {
        return ok(await getClient().coupons.delete(coupon_id));
      } catch (e) {
        return fail(e);
      }
    },
  );

  // —— Notifications / Settings / Members / Mapping ——
  server.tool(
    "bricklink_list_notifications",
    "List unread push notifications (Order, Message, Feedback events).",
    {},
    async () => {
      try {
        return ok(await getClient().notifications.list());
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.tool(
    "bricklink_list_shipping_methods",
    "List your store shipping methods.",
    {},
    async () => {
      try {
        return ok(await getClient().settings.listShippingMethods());
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.tool(
    "bricklink_get_shipping_method",
    "Get one shipping method.",
    { method_id: z.number().int() },
    async ({ method_id }) => {
      try {
        return ok(await getClient().settings.getShippingMethod(method_id));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.tool(
    "bricklink_get_member_rating",
    "Get public feedback ratings for a BrickLink member.",
    { username: z.string() },
    async ({ username }) => {
      try {
        return ok(await getClient().members.getRating(username));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.tool(
    "bricklink_get_member_note",
    "Get your private note on a member.",
    { username: z.string() },
    async ({ username }) => {
      try {
        return ok(await getClient().members.getNote(username));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.tool(
    "bricklink_create_member_note",
    "Create a private note on a member.",
    { username: z.string(), note_text: z.string() },
    async ({ username, note_text }) => {
      try {
        return ok(await getClient().members.createNote(username, note_text));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.tool(
    "bricklink_update_member_note",
    "Update your private note on a member.",
    { username: z.string(), note_text: z.string() },
    async ({ username, note_text }) => {
      try {
        return ok(await getClient().members.updateNote(username, note_text));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.tool(
    "bricklink_delete_member_note",
    "Delete your private note on a member.",
    { username: z.string() },
    async ({ username }) => {
      try {
        return ok(await getClient().members.deleteNote(username));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.tool(
    "bricklink_get_element_id",
    "Map a BrickLink catalog PART to ElementID (part-color-code).",
    {
      type: z.string().default("PART"),
      no: z.string(),
      color_id: z.number().int().optional(),
    },
    async ({ type, no, color_id }) => {
      try {
        return ok(await getClient().itemMapping.getElementId(type, no, color_id));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.tool(
    "bricklink_get_item_number",
    "Reverse map ElementID to BrickLink catalog item number.",
    { element_id: z.string() },
    async ({ element_id }) => {
      try {
        return ok(await getClient().itemMapping.getItemNumber(element_id));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.tool(
    "bricklink_ping",
    "Verify OAuth credentials by fetching received orders.",
    {},
    async () => {
      try {
        const orders = await getClient().orders.list({ direction: "in" });
        return ok({
          ok: true,
          received_order_count: Array.isArray(orders) ? orders.length : 0,
        });
      } catch (e) {
        return fail(e);
      }
    },
  );
}

async function main(): Promise<void> {
  const server = new McpServer({
    name: "bricklink",
    version: "1.0.0",
  });

  registerTools(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("BrickLink MCP server running on stdio");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
