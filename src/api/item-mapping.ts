import type { BrickLinkHttpClient } from "../client/client.js";
import type { ItemMapping, ItemType } from "../client/types.js";

export class ItemMappingApi {
  constructor(private readonly http: BrickLinkHttpClient) {}

  /** Get ElementID (part-color-code) for a catalog item. Type is typically PART. */
  getElementId(
    type: ItemType | string,
    no: string,
    colorId?: number,
  ): Promise<ItemMapping[]> {
    return this.http.get<ItemMapping[]>(
      `/item_mapping/${encodeURIComponent(type)}/${encodeURIComponent(no)}`,
      { color_id: colorId },
    );
  }

  /** Reverse lookup: ElementID → BrickLink catalog item. */
  getItemNumber(elementId: string): Promise<ItemMapping[]> {
    return this.http.get<ItemMapping[]>(
      `/item_mapping/${encodeURIComponent(elementId)}`,
    );
  }
}
