import { CatalogApi } from "../api/catalog.js";
import { CategoriesApi } from "../api/categories.js";
import { ColorsApi } from "../api/colors.js";
import { CouponsApi } from "../api/coupons.js";
import { FeedbackApi } from "../api/feedback.js";
import { InventoriesApi } from "../api/inventories.js";
import { ItemMappingApi } from "../api/item-mapping.js";
import { MembersApi } from "../api/members.js";
import { NotificationsApi } from "../api/notifications.js";
import { OrdersApi } from "../api/orders.js";
import { SettingsApi } from "../api/settings.js";
import { BrickLinkHttpClient } from "./client.js";
import { loadCredentials } from "./credentials.js";
import type { BrickLinkClientOptions, BrickLinkCredentials } from "./types.js";

export class BrickLinkClient {
  readonly http: BrickLinkHttpClient;
  readonly orders: OrdersApi;
  readonly inventories: InventoriesApi;
  readonly catalog: CatalogApi;
  readonly feedback: FeedbackApi;
  readonly colors: ColorsApi;
  readonly categories: CategoriesApi;
  readonly coupons: CouponsApi;
  readonly notifications: NotificationsApi;
  readonly settings: SettingsApi;
  readonly members: MembersApi;
  readonly itemMapping: ItemMappingApi;

  constructor(options: BrickLinkClientOptions) {
    this.http = new BrickLinkHttpClient(options);
    this.orders = new OrdersApi(this.http);
    this.inventories = new InventoriesApi(this.http);
    this.catalog = new CatalogApi(this.http);
    this.feedback = new FeedbackApi(this.http);
    this.colors = new ColorsApi(this.http);
    this.categories = new CategoriesApi(this.http);
    this.coupons = new CouponsApi(this.http);
    this.notifications = new NotificationsApi(this.http);
    this.settings = new SettingsApi(this.http);
    this.members = new MembersApi(this.http);
    this.itemMapping = new ItemMappingApi(this.http);
  }

  /** Create a client using env vars / config file credentials. */
  static fromEnv(
    overrides: Partial<BrickLinkCredentials> = {},
    options: Omit<BrickLinkClientOptions, "credentials"> = {},
  ): BrickLinkClient {
    return new BrickLinkClient({
      ...options,
      credentials: loadCredentials(overrides),
    });
  }
}
