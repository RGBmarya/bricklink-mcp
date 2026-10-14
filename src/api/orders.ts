import type { BrickLinkHttpClient } from "../client/client.js";
import type {
  Direction,
  Feedback,
  Order,
  OrderItem,
  OrderMessage,
  OrderStatus,
  UpdateOrderInput,
} from "../client/types.js";

export interface ListOrdersOptions {
  /** "in" = received (seller), "out" = placed (buyer). Default: in */
  direction?: Direction;
  /** Comma-separated statuses; prefix with - to exclude. */
  status?: string;
  filed?: boolean;
}

export class OrdersApi {
  constructor(private readonly http: BrickLinkHttpClient) {}

  /** List orders you received (producer) or placed (consumer). */
  list(options: ListOrdersOptions = {}): Promise<Order[]> {
    return this.http.get<Order[]>("/orders", {
      direction: options.direction,
      status: options.status,
      filed: options.filed,
    });
  }

  get(orderId: number): Promise<Order> {
    return this.http.get<Order>(`/orders/${orderId}`);
  }

  /** Items are returned as batches (array of arrays). */
  getItems(orderId: number): Promise<OrderItem[][]> {
    return this.http.get<OrderItem[][]>(`/orders/${orderId}/items`);
  }

  getMessages(orderId: number): Promise<OrderMessage[]> {
    return this.http.get<OrderMessage[]>(`/orders/${orderId}/messages`);
  }

  getFeedback(orderId: number): Promise<Feedback[]> {
    return this.http.get<Feedback[]>(`/orders/${orderId}/feedback`);
  }

  update(orderId: number, body: UpdateOrderInput): Promise<Order> {
    return this.http.put<Order>(`/orders/${orderId}`, body);
  }

  updateStatus(orderId: number, status: OrderStatus): Promise<unknown> {
    return this.http.put(`/orders/${orderId}/status`, {
      field: "status",
      value: status,
    });
  }

  updatePaymentStatus(orderId: number, paymentStatus: string): Promise<unknown> {
    return this.http.put(`/orders/${orderId}/payment_status`, {
      field: "payment_status",
      value: paymentStatus,
    });
  }

  /** Send "Thank You, Drive Thru!" email to the buyer. */
  sendDriveThru(orderId: number, mailMe = false): Promise<unknown> {
    return this.http.post(`/orders/${orderId}/drive_thru`, undefined, {
      mail_me: mailMe,
    });
  }
}
