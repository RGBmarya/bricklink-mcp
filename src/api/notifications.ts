import type { BrickLinkHttpClient } from "../client/client.js";
import type { Notification } from "../client/types.js";

export class NotificationsApi {
  constructor(private readonly http: BrickLinkHttpClient) {}

  /** List unread push notifications (orders, messages, feedback). */
  list(): Promise<Notification[]> {
    return this.http.get<Notification[]>("/notifications");
  }
}
