import type { BrickLinkHttpClient } from "../client/client.js";
import type { Coupon, CreateCouponInput, Direction } from "../client/types.js";

export interface ListCouponsOptions {
  direction?: Direction;
  /** O/S/D/E; comma-separated; prefix with - to exclude. */
  status?: string;
}

export class CouponsApi {
  constructor(private readonly http: BrickLinkHttpClient) {}

  list(options: ListCouponsOptions = {}): Promise<Coupon[]> {
    return this.http.get<Coupon[]>("/coupons", {
      direction: options.direction ?? "out",
      status: options.status,
    });
  }

  get(couponId: number): Promise<Coupon> {
    return this.http.get<Coupon>(`/coupons/${couponId}`);
  }

  create(body: CreateCouponInput): Promise<Coupon> {
    return this.http.post<Coupon>("/coupons", body);
  }

  update(couponId: number, body: Partial<CreateCouponInput>): Promise<Coupon> {
    return this.http.put<Coupon>(`/coupons/${couponId}`, body);
  }

  delete(couponId: number): Promise<unknown> {
    return this.http.delete(`/coupons/${couponId}`);
  }
}
