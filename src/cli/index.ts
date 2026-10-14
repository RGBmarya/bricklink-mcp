#!/usr/bin/env node
import { Command } from "commander";
import { BrickLinkClient } from "../client/bricklink.js";
import { BrickLinkError } from "../client/errors.js";
import type { CreateCouponInput, CreateInventoryInput, UpdateInventoryInput, UpdateOrderInput } from "../client/types.js";

function client(): BrickLinkClient {
  return BrickLinkClient.fromEnv();
}

function print(data: unknown, asJson = true): void {
  if (asJson) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log(data);
  }
}

function parseJsonFlag(value: string | undefined, flagName: string): unknown {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`Invalid JSON for --${flagName}`);
  }
}

async function run(): Promise<void> {
  const program = new Command();
  program
    .name("bricklink")
    .description(
      "BrickLink Store API CLI — catalog, orders, inventory, feedback, coupons, and more",
    )
    .version("1.0.0");

  // —— Catalog (consumer + producer research) ——
  const catalog = program.command("catalog").description("Catalog item lookups and price guides");

  catalog
    .command("item")
    .description("Get catalog item details")
    .argument("<type>", "Item type (PART, SET, MINIFIG, ...)")
    .argument("<no>", "Item number")
    .action(async (type: string, no: string) => {
      print(await client().catalog.getItem(type, no));
    });

  catalog
    .command("supersets")
    .description("Items that include this item")
    .argument("<type>", "Item type")
    .argument("<no>", "Item number")
    .option("--color-id <id>", "Color id", Number)
    .action(async (type: string, no: string, opts: { colorId?: number }) => {
      print(await client().catalog.getSupersets(type, no, opts.colorId));
    });

  catalog
    .command("subsets")
    .description("Part-out / items included in this item")
    .argument("<type>", "Item type")
    .argument("<no>", "Item number")
    .option("--color-id <id>", "Color id", Number)
    .option("--box", "Include original box")
    .option("--instruction", "Include instruction")
    .option("--break-minifigs", "Break minifigs into parts")
    .option("--break-subsets", "Break nested sets")
    .action(
      async (
        type: string,
        no: string,
        opts: {
          colorId?: number;
          box?: boolean;
          instruction?: boolean;
          breakMinifigs?: boolean;
          breakSubsets?: boolean;
        },
      ) => {
        print(
          await client().catalog.getSubsets(type, no, {
            color_id: opts.colorId,
            box: opts.box,
            instruction: opts.instruction,
            break_minifigs: opts.breakMinifigs,
            break_subsets: opts.breakSubsets,
          }),
        );
      },
    );

  catalog
    .command("price")
    .description("Price guide (stock or sold)")
    .argument("<type>", "Item type")
    .argument("<no>", "Item number")
    .option("--color-id <id>", "Color id", Number)
    .option("--guide-type <type>", "sold | stock", "stock")
    .option("--condition <n|u>", "N or U", "N")
    .option("--country <code>", "Seller country filter")
    .option("--region <name>", "Seller region filter")
    .option("--currency <code>", "Currency code")
    .action(
      async (
        type: string,
        no: string,
        opts: {
          colorId?: number;
          guideType: string;
          condition: string;
          country?: string;
          region?: string;
          currency?: string;
        },
      ) => {
        print(
          await client().catalog.getPriceGuide(type, no, {
            color_id: opts.colorId,
            guide_type: opts.guideType as "sold" | "stock",
            new_or_used: opts.condition.toUpperCase() as "N" | "U",
            country_code: opts.country,
            region: opts.region,
            currency_code: opts.currency,
          }),
        );
      },
    );

  // —— Orders (consumer: out / producer: in) ——
  const orders = program.command("orders").description("Orders you received or placed");

  orders
    .command("list")
    .description("List orders")
    .option("-d, --direction <dir>", "in (received) or out (placed)", "in")
    .option("-s, --status <status>", "Status include/exclude filter")
    .option("--filed", "Filed orders only")
    .action(async (opts: { direction: string; status?: string; filed?: boolean }) => {
      print(
        await client().orders.list({
          direction: opts.direction as "in" | "out",
          status: opts.status,
          filed: opts.filed,
        }),
      );
    });

  orders
    .command("get")
    .description("Get order details")
    .argument("<orderId>", "Order id", Number)
    .action(async (orderId: number) => {
      print(await client().orders.get(orderId));
    });

  orders
    .command("items")
    .description("Get order line items")
    .argument("<orderId>", "Order id", Number)
    .action(async (orderId: number) => {
      print(await client().orders.getItems(orderId));
    });

  orders
    .command("messages")
    .description("Get order messages")
    .argument("<orderId>", "Order id", Number)
    .action(async (orderId: number) => {
      print(await client().orders.getMessages(orderId));
    });

  orders
    .command("feedback")
    .description("Get order feedback")
    .argument("<orderId>", "Order id", Number)
    .action(async (orderId: number) => {
      print(await client().orders.getFeedback(orderId));
    });

  orders
    .command("update")
    .description("Update order shipping/cost/remarks (JSON body)")
    .argument("<orderId>", "Order id", Number)
    .requiredOption("--json <body>", "Update payload JSON")
    .action(async (orderId: number, opts: { json: string }) => {
      const body = parseJsonFlag(opts.json, "json") as UpdateOrderInput;
      print(await client().orders.update(orderId, body));
    });

  orders
    .command("status")
    .description("Update order status")
    .argument("<orderId>", "Order id", Number)
    .argument("<status>", "New status (e.g. PACKED, SHIPPED, COMPLETED)")
    .action(async (orderId: number, status: string) => {
      print(await client().orders.updateStatus(orderId, status));
    });

  orders
    .command("payment-status")
    .description("Update payment status")
    .argument("<orderId>", "Order id", Number)
    .argument("<status>", "Payment status (e.g. Received)")
    .action(async (orderId: number, status: string) => {
      print(await client().orders.updatePaymentStatus(orderId, status));
    });

  orders
    .command("drive-thru")
    .description('Send "Thank You, Drive Thru!" email')
    .argument("<orderId>", "Order id", Number)
    .option("--mail-me", "CC yourself")
    .action(async (orderId: number, opts: { mailMe?: boolean }) => {
      print(await client().orders.sendDriveThru(orderId, Boolean(opts.mailMe)));
    });

  // —— Inventories (producer) ——
  const inv = program.command("inventory").description("Store inventory management");

  inv
    .command("list")
    .description("List inventory lots")
    .option("--item-type <types>", "Filter by item type(s)")
    .option("--status <status>", "Y/S/B/C/N/R filter")
    .option("--category-id <id>", "Category filter")
    .option("--color-id <id>", "Color filter")
    .action(
      async (opts: {
        itemType?: string;
        status?: string;
        categoryId?: string;
        colorId?: string;
      }) => {
        print(
          await client().inventories.list({
            item_type: opts.itemType,
            status: opts.status,
            category_id: opts.categoryId,
            color_id: opts.colorId,
          }),
        );
      },
    );

  inv
    .command("get")
    .description("Get one inventory lot")
    .argument("<inventoryId>", "Inventory id", Number)
    .action(async (inventoryId: number) => {
      print(await client().inventories.get(inventoryId));
    });

  inv
    .command("create")
    .description("Create one inventory lot (JSON body)")
    .requiredOption("--json <body>", "Inventory payload JSON")
    .action(async (opts: { json: string }) => {
      const body = parseJsonFlag(opts.json, "json") as CreateInventoryInput;
      print(await client().inventories.create(body));
    });

  inv
    .command("create-many")
    .description("Create multiple inventory lots (JSON array)")
    .requiredOption("--json <body>", "Array of inventory payloads")
    .action(async (opts: { json: string }) => {
      const body = parseJsonFlag(opts.json, "json") as CreateInventoryInput[];
      print(await client().inventories.createMany(body));
    });

  inv
    .command("update")
    .description("Update inventory lot (quantity must be +/- relative)")
    .argument("<inventoryId>", "Inventory id", Number)
    .requiredOption("--json <body>", "Update payload JSON")
    .action(async (inventoryId: number, opts: { json: string }) => {
      const body = parseJsonFlag(opts.json, "json") as UpdateInventoryInput;
      print(await client().inventories.update(inventoryId, body));
    });

  inv
    .command("delete")
    .description("Delete inventory lot")
    .argument("<inventoryId>", "Inventory id", Number)
    .action(async (inventoryId: number) => {
      print(await client().inventories.delete(inventoryId));
    });

  // —— Feedback ——
  const feedback = program.command("feedback").description("Feedback you received or posted");

  feedback
    .command("list")
    .option("-d, --direction <dir>", "in or out", "in")
    .action(async (opts: { direction: string }) => {
      print(await client().feedback.list(opts.direction as "in" | "out"));
    });

  feedback
    .command("get")
    .argument("<feedbackId>", "Feedback id", Number)
    .action(async (feedbackId: number) => {
      print(await client().feedback.get(feedbackId));
    });

  feedback
    .command("post")
    .description("Post feedback for an order")
    .requiredOption("--order-id <id>", "Order id", Number)
    .requiredOption("--rating <n>", "0 praise, 1 neutral, 2 complaint", Number)
    .requiredOption("--comment <text>", "Comment")
    .action(async (opts: { orderId: number; rating: number; comment: string }) => {
      print(
        await client().feedback.create({
          order_id: opts.orderId,
          rating: opts.rating,
          comment: opts.comment,
        }),
      );
    });

  feedback
    .command("reply")
    .argument("<feedbackId>", "Feedback id", Number)
    .requiredOption("--reply <text>", "Reply text")
    .action(async (feedbackId: number, opts: { reply: string }) => {
      print(await client().feedback.reply(feedbackId, opts.reply));
    });

  // —— Colors / Categories ——
  program
    .command("colors")
    .description("List all BrickLink colors")
    .action(async () => {
      print(await client().colors.list());
    });

  program
    .command("color")
    .description("Get one color")
    .argument("<colorId>", "Color id", Number)
    .action(async (colorId: number) => {
      print(await client().colors.get(colorId));
    });

  program
    .command("categories")
    .description("List all categories")
    .action(async () => {
      print(await client().categories.list());
    });

  program
    .command("category")
    .description("Get one category")
    .argument("<categoryId>", "Category id", Number)
    .action(async (categoryId: number) => {
      print(await client().categories.get(categoryId));
    });

  // —— Coupons ——
  const coupons = program.command("coupons").description("Store coupons");

  coupons
    .command("list")
    .option("-d, --direction <dir>", "out (created) or in (received)", "out")
    .option("-s, --status <status>", "O/S/D/E filter")
    .action(async (opts: { direction: string; status?: string }) => {
      print(
        await client().coupons.list({
          direction: opts.direction as "in" | "out",
          status: opts.status,
        }),
      );
    });

  coupons
    .command("get")
    .argument("<couponId>", "Coupon id", Number)
    .action(async (couponId: number) => {
      print(await client().coupons.get(couponId));
    });

  coupons
    .command("create")
    .requiredOption("--json <body>", "Coupon payload JSON")
    .action(async (opts: { json: string }) => {
      print(await client().coupons.create(parseJsonFlag(opts.json, "json") as CreateCouponInput));
    });

  coupons
    .command("update")
    .argument("<couponId>", "Coupon id", Number)
    .requiredOption("--json <body>", "Coupon update JSON")
    .action(async (couponId: number, opts: { json: string }) => {
      print(
        await client().coupons.update(
          couponId,
          parseJsonFlag(opts.json, "json") as Partial<CreateCouponInput>,
        ),
      );
    });

  coupons
    .command("delete")
    .argument("<couponId>", "Coupon id", Number)
    .action(async (couponId: number) => {
      print(await client().coupons.delete(couponId));
    });

  // —— Notifications ——
  program
    .command("notifications")
    .description("List unread push notifications")
    .action(async () => {
      print(await client().notifications.list());
    });

  // —— Settings ——
  const settings = program.command("settings").description("Store settings");

  settings
    .command("shipping-methods")
    .description("List shipping methods")
    .action(async () => {
      print(await client().settings.listShippingMethods());
    });

  settings
    .command("shipping-method")
    .argument("<methodId>", "Method id", Number)
    .action(async (methodId: number) => {
      print(await client().settings.getShippingMethod(methodId));
    });

  // —— Members ——
  const members = program.command("members").description("Member ratings and private notes");

  members
    .command("rating")
    .argument("<username>", "BrickLink username")
    .action(async (username: string) => {
      print(await client().members.getRating(username));
    });

  members
    .command("note")
    .argument("<username>", "BrickLink username")
    .action(async (username: string) => {
      print(await client().members.getNote(username));
    });

  members
    .command("note-create")
    .argument("<username>", "BrickLink username")
    .requiredOption("--text <text>", "Note text")
    .action(async (username: string, opts: { text: string }) => {
      print(await client().members.createNote(username, opts.text));
    });

  members
    .command("note-update")
    .argument("<username>", "BrickLink username")
    .requiredOption("--text <text>", "Note text")
    .action(async (username: string, opts: { text: string }) => {
      print(await client().members.updateNote(username, opts.text));
    });

  members
    .command("note-delete")
    .argument("<username>", "BrickLink username")
    .action(async (username: string) => {
      print(await client().members.deleteNote(username));
    });

  // —— Item mapping ——
  const mapping = program.command("mapping").description("ElementID ↔ catalog item mapping");

  mapping
    .command("element")
    .description("Get ElementID for a catalog item")
    .argument("<type>", "Usually PART")
    .argument("<no>", "Item number")
    .option("--color-id <id>", "Color id", Number)
    .action(async (type: string, no: string, opts: { colorId?: number }) => {
      print(await client().itemMapping.getElementId(type, no, opts.colorId));
    });

  mapping
    .command("item")
    .description("Get catalog item from ElementID")
    .argument("<elementId>", "Element / part-color code")
    .action(async (elementId: string) => {
      print(await client().itemMapping.getItemNumber(elementId));
    });

  // —— Whoami / ping ——
  program
    .command("ping")
    .description("Verify credentials by listing received orders (page-equivalent smoke test)")
    .action(async () => {
      const ordersList = await client().orders.list({ direction: "in" });
      print({
        ok: true,
        received_order_count: Array.isArray(ordersList) ? ordersList.length : 0,
      });
    });

  await program.parseAsync(process.argv);
}

run().catch((err: unknown) => {
  if (err instanceof BrickLinkError) {
    console.error(
      JSON.stringify(
        {
          error: err.message,
          status: err.status,
          meta: err.meta,
        },
        null,
        2,
      ),
    );
  } else if (err instanceof Error) {
    console.error(err.message);
  } else {
    console.error(String(err));
  }
  process.exitCode = 1;
});
