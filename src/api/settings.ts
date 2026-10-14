import type { BrickLinkHttpClient } from "../client/client.js";
import type { ShippingMethod } from "../client/types.js";

export class SettingsApi {
  constructor(private readonly http: BrickLinkHttpClient) {}

  listShippingMethods(): Promise<ShippingMethod[]> {
    return this.http.get<ShippingMethod[]>("/settings/shipping_methods");
  }

  getShippingMethod(methodId: number): Promise<ShippingMethod> {
    return this.http.get<ShippingMethod>(`/settings/shipping_methods/${methodId}`);
  }
}
