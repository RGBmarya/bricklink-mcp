/** BrickLink catalog item types. */
export type ItemType =
  | "MINIFIG"
  | "PART"
  | "SET"
  | "BOOK"
  | "GEAR"
  | "CATALOG"
  | "INSTRUCTION"
  | "UNSORTED_LOT"
  | "ORIGINAL_BOX";

/** New or used condition. */
export type Condition = "N" | "U";

/** Set completeness. */
export type Completeness = "C" | "B" | "S";

/** Order direction relative to the authenticated user. */
export type Direction = "in" | "out";

/** Price guide type. */
export type GuideType = "sold" | "stock";

/** Inventory / stockroom status filters. */
export type InventoryStatus = "Y" | "S" | "B" | "C" | "N" | "R";

/** Stockroom id when using multiple stockrooms. */
export type StockRoomId = "A" | "B" | "C";

/** Coupon status. */
export type CouponStatus = "O" | "S" | "D" | "E";

/** Feedback rating: 0 praise, 1 neutral, 2 complaint. */
export type FeedbackRating = 0 | 1 | 2;

/** Common BrickLink order status values. */
export type OrderStatus =
  | "PENDING"
  | "UPDATED"
  | "PROCESSING"
  | "READY"
  | "PAID"
  | "PACKED"
  | "SHIPPED"
  | "RECEIVED"
  | "COMPLETED"
  | "OCR"
  | "NPB"
  | "NPX"
  | "NRS"
  | "NSS"
  | "CANCELLED"
  | "PURGED"
  | string;

export interface BrickLinkCredentials {
  consumerKey: string;
  consumerSecret: string;
  token: string;
  tokenSecret: string;
}

export interface BrickLinkClientOptions {
  credentials: BrickLinkCredentials;
  /** Defaults to https://api.bricklink.com/api/store/v1 */
  baseUrl?: string;
  /** Optional fetch implementation (for tests). */
  fetch?: typeof fetch;
}

export interface ApiMeta {
  code: number | string;
  message: string;
  description: string;
}

export interface ApiResponse<T> {
  meta: ApiMeta;
  data: T;
}

export interface CatalogItemRef {
  no: string;
  name?: string;
  type: ItemType | string;
  category_id?: number;
  /** Some responses use categoryID */
  categoryID?: number;
}

export interface CatalogItem extends CatalogItemRef {
  alternate_no?: string;
  image_url?: string;
  thumbnail_url?: string;
  weight?: string;
  dim_x?: string;
  dim_y?: string;
  dim_z?: string;
  year_released?: number;
  description?: string;
  is_obsolete?: boolean;
  language_code?: string;
}

export interface AddressName {
  full?: string;
  family?: string;
  given?: string;
  middle?: string;
}

export interface Address {
  name?: AddressName;
  full?: string;
  address1?: string;
  address2?: string;
  address3?: string;
  country_code?: string;
  city?: string;
  state?: string;
  postal_code?: string;
}

export interface PaymentInfo {
  method?: string;
  currency_code?: string;
  date_paid?: string;
  status?: string;
}

export interface ShippingInfo {
  method_id?: number;
  method?: string;
  tracking_no?: string;
  tracking_link?: string;
  date_shipped?: string;
  address?: Address;
}

export interface CostInfo {
  currency_code?: string;
  disp_currency_code?: string;
  subtotal?: string;
  grand_total?: string;
  /** Legacy alias seen in some docs */
  grandtotal?: string;
  disp_subtotal?: string;
  disp_grand_total?: string;
  etc1?: string;
  etc2?: string;
  insurance?: string;
  shipping?: string;
  credit?: string;
  coupon?: string;
  vat_rate?: string;
  vat_amount?: string;
}

export interface Order {
  order_id: number;
  date_ordered?: string;
  date_status_changed?: string;
  seller_name?: string;
  store_name?: string;
  buyer_name?: string;
  buyer_email?: string;
  require_insurance?: boolean;
  status?: OrderStatus;
  is_invoiced?: boolean;
  is_filed?: boolean;
  drive_thru_sent?: boolean;
  remarks?: string;
  total_count?: number;
  unique_count?: number;
  total_weight?: string;
  buyer_order_count?: number;
  payment?: PaymentInfo;
  shipping?: ShippingInfo;
  cost?: CostInfo;
  disp_cost?: CostInfo;
}

export interface OrderItem {
  inventory_id?: number;
  item: CatalogItemRef;
  color_id?: number;
  quantity?: number;
  new_or_used?: Condition;
  completeness?: Completeness;
  unit_price?: string;
  unit_price_final?: string;
  disp_unit_price?: string;
  disp_unit_price_final?: string;
  currency_code?: string;
  disp_currency_code?: string;
  remarks?: string;
  description?: string;
}

export interface OrderMessage {
  subject?: string;
  body?: string;
  from?: string;
  to?: string;
  dateSent?: string;
}

export interface InventoryItem {
  inventory_id: number;
  item: CatalogItemRef;
  color_id?: number;
  color_name?: string;
  quantity: number;
  new_or_used?: Condition;
  completeness?: Completeness;
  unit_price: string;
  bind_id?: number;
  description?: string;
  remarks?: string;
  bulk?: number;
  is_retain?: boolean;
  is_stock_room?: boolean;
  stock_room_id?: StockRoomId | string;
  date_created?: string;
  my_cost?: string;
  sale_rate?: number;
  tier_quantity1?: number;
  tier_price1?: string;
  tier_quantity2?: number;
  tier_price2?: string;
  tier_quantity3?: number;
  tier_price3?: string;
  my_weight?: string;
}

export interface CreateInventoryInput {
  item: { no: string; type: ItemType | string };
  color_id: number;
  quantity: number;
  unit_price: string | number;
  new_or_used: Condition;
  completeness?: Completeness;
  description?: string;
  remarks?: string;
  bulk?: number;
  is_retain?: boolean;
  is_stock_room?: boolean;
  stock_room_id?: StockRoomId | string;
  my_cost?: string | number;
  sale_rate?: number;
  tier_quantity1?: number;
  tier_price1?: string | number;
  tier_quantity2?: number;
  tier_price2?: string | number;
  tier_quantity3?: number;
  tier_price3?: string | number;
  my_weight?: string | number;
}

export interface UpdateInventoryInput {
  color_id?: number;
  /** Relative change only: must start with + or - (e.g. "+5", "-2"). */
  quantity?: string | number;
  unit_price?: string | number;
  new_or_used?: Condition;
  completeness?: Completeness;
  description?: string;
  remarks?: string;
  bulk?: number;
  is_retain?: boolean;
  is_stock_room?: boolean;
  stock_room_id?: StockRoomId | string;
  my_cost?: string | number;
  sale_rate?: number;
  tier_quantity1?: number;
  tier_price1?: string | number;
  tier_quantity2?: number;
  tier_price2?: string | number;
  tier_quantity3?: number;
  tier_price3?: string | number;
  my_weight?: string | number;
}

export interface UpdateOrderInput {
  shipping?: {
    date_shipped?: string;
    tracking_no?: string;
    tracking_link?: string;
    method_id?: number;
  };
  cost?: {
    shipping?: string | number;
    insurance?: string | number;
    credit?: string | number;
    etc1?: string | number;
    etc2?: string | number;
  };
  is_filed?: boolean;
  remarks?: string;
}

export interface Feedback {
  feedback_id: number;
  order_id: number;
  from?: string;
  to?: string;
  date_rated?: string;
  rating: FeedbackRating | number;
  rating_of_bs?: "S" | "B" | string;
  comment?: string;
  reply?: string;
}

export interface CreateFeedbackInput {
  order_id: number;
  rating: FeedbackRating | number;
  comment: string;
}

export interface Color {
  color_id: number;
  color_name: string;
  color_code?: string;
  color_type?: string;
}

export interface Category {
  category_id: number;
  category_name: string;
  parent_id?: number;
}

export interface Notification {
  event_type: "Order" | "Message" | "Feedback" | string;
  resource_id: number;
  timestamp: string;
}

export interface SupersetEntry {
  color_id?: number;
  entries: Array<{
    item: CatalogItemRef;
    quantity?: number;
    appears_as?: string;
    appear_as?: string;
  }>;
}

export interface SubsetEntry {
  match_no?: number;
  entries: Array<{
    item: CatalogItemRef;
    color_id?: number;
    quantity?: number;
    extra_quantity?: number;
    is_alternate?: boolean | string;
  }>;
}

export interface PriceDetail {
  quantity?: number;
  /** Historical typo still returned by BrickLink for a while */
  qunatity?: number;
  unit_price?: string;
  shipping_available?: boolean;
  seller_country_code?: string;
  buyer_country_code?: string;
  date_ordered?: string;
}

export interface PriceGuide {
  item: CatalogItemRef;
  new_or_used?: Condition;
  currency_code?: string;
  min_price?: string;
  max_price?: string;
  avg_price?: string;
  qty_avg_price?: string;
  unit_quantity?: number;
  total_quantity?: number;
  price_detail?: PriceDetail[];
}

export interface Coupon {
  coupon_id: number;
  date_issued?: string;
  date_expire?: string;
  seller_name?: string;
  buyer_name?: string;
  store_name?: string;
  status?: CouponStatus | string;
  remarks_from_seller?: string;
  remarks_from_buyer?: string;
  currency_code?: string;
  disp_currency_code?: string;
  discount_type?: "F" | "S" | "P" | string;
  discount_amount?: string | number;
  discount_rate?: number;
  max_discount_amount?: string | number;
  applies_to?: string;
  except_on?: string;
  is_buyer_restricted?: boolean;
  is_discount_same_as_item?: boolean;
  is_order_tiered?: boolean;
  tier?: unknown;
}

export interface CreateCouponInput {
  buyer_name: string;
  discount_type: "F" | "S" | "P" | string;
  discount_amount?: string | number;
  discount_rate?: number;
  max_discount_amount?: string | number;
  currency_code?: string;
  remarks_from_seller?: string;
  date_expire?: string;
  applies_to?: string;
  except_on?: string;
  is_buyer_restricted?: boolean;
  is_discount_same_as_item?: boolean;
  is_order_tiered?: boolean;
  [key: string]: unknown;
}

export interface ShippingMethod {
  method_id: number;
  name?: string;
  type?: string;
  is_insurance?: boolean;
  is_available?: boolean;
  insurance?: unknown;
  [key: string]: unknown;
}

export interface MemberRating {
  rating_total?: number;
  rating_of_seller?: {
    praise?: number;
    neutral?: number;
    complaint?: number;
  };
  rating_of_buyer?: {
    praise?: number;
    neutral?: number;
    complaint?: number;
  };
  [key: string]: unknown;
}

export interface MemberNote {
  note_text?: string;
  date_rated?: string;
  [key: string]: unknown;
}

export interface ItemMapping {
  item?: CatalogItemRef;
  color_id?: number;
  color_name?: string;
  element_id?: string;
  [key: string]: unknown;
}

export type QueryValue = string | number | boolean | undefined | null;

export type QueryParams = Record<string, QueryValue>;
