import type { BrickLinkHttpClient } from "../client/client.js";
import type {
  CatalogItem,
  Condition,
  GuideType,
  ItemType,
  PriceGuide,
  SubsetEntry,
  SupersetEntry,
} from "../client/types.js";

export interface PriceGuideOptions {
  color_id?: number;
  guide_type?: GuideType;
  new_or_used?: Condition;
  country_code?: string;
  region?: string;
  currency_code?: string;
}

export interface SubsetOptions {
  color_id?: number;
  box?: boolean;
  instruction?: boolean;
  break_minifigs?: boolean;
  break_subsets?: boolean;
}

export class CatalogApi {
  constructor(private readonly http: BrickLinkHttpClient) {}

  getItem(type: ItemType | string, no: string): Promise<CatalogItem> {
    return this.http.get<CatalogItem>(`/items/${encodeURIComponent(type)}/${encodeURIComponent(no)}`);
  }

  getSupersets(
    type: ItemType | string,
    no: string,
    colorId?: number,
  ): Promise<SupersetEntry[]> {
    return this.http.get<SupersetEntry[]>(
      `/items/${encodeURIComponent(type)}/${encodeURIComponent(no)}/supersets`,
      { color_id: colorId },
    );
  }

  getSubsets(
    type: ItemType | string,
    no: string,
    options: SubsetOptions = {},
  ): Promise<SubsetEntry[]> {
    return this.http.get<SubsetEntry[]>(
      `/items/${encodeURIComponent(type)}/${encodeURIComponent(no)}/subsets`,
      {
        color_id: options.color_id,
        box: options.box,
        instruction: options.instruction,
        break_minifigs: options.break_minifigs,
        break_subsets: options.break_subsets,
      },
    );
  }

  getPriceGuide(
    type: ItemType | string,
    no: string,
    options: PriceGuideOptions = {},
  ): Promise<PriceGuide> {
    return this.http.get<PriceGuide>(
      `/items/${encodeURIComponent(type)}/${encodeURIComponent(no)}/price`,
      {
        color_id: options.color_id,
        guide_type: options.guide_type,
        new_or_used: options.new_or_used,
        country_code: options.country_code,
        region: options.region,
        currency_code: options.currency_code,
      },
    );
  }
}
