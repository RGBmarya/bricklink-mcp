import type { BrickLinkHttpClient } from "../client/client.js";
import type {
  CreateInventoryInput,
  InventoryItem,
  UpdateInventoryInput,
} from "../client/types.js";

export interface ListInventoriesOptions {
  /** Comma-separated item types; prefix with - to exclude. */
  item_type?: string;
  /** Y/S/B/C/N/R; comma-separated; prefix with - to exclude. */
  status?: string;
  category_id?: string | number;
  color_id?: string | number;
}

export class InventoriesApi {
  constructor(private readonly http: BrickLinkHttpClient) {}

  list(options: ListInventoriesOptions = {}): Promise<InventoryItem[]> {
    return this.http.get<InventoryItem[]>("/inventories", {
      item_type: options.item_type,
      status: options.status,
      category_id: options.category_id,
      color_id: options.color_id,
    });
  }

  get(inventoryId: number): Promise<InventoryItem> {
    return this.http.get<InventoryItem>(`/inventories/${inventoryId}`);
  }

  create(body: CreateInventoryInput): Promise<InventoryItem> {
    return this.http.post<InventoryItem>("/inventories", body);
  }

  /** Create multiple lots in one request. */
  createMany(items: CreateInventoryInput[]): Promise<unknown> {
    return this.http.post("/inventories", items);
  }

  update(inventoryId: number, body: UpdateInventoryInput): Promise<InventoryItem> {
    return this.http.put<InventoryItem>(`/inventories/${inventoryId}`, body);
  }

  delete(inventoryId: number): Promise<unknown> {
    return this.http.delete(`/inventories/${inventoryId}`);
  }
}
