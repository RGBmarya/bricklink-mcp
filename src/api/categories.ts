import type { BrickLinkHttpClient } from "../client/client.js";
import type { Category } from "../client/types.js";

export class CategoriesApi {
  constructor(private readonly http: BrickLinkHttpClient) {}

  list(): Promise<Category[]> {
    return this.http.get<Category[]>("/categories");
  }

  get(categoryId: number): Promise<Category> {
    return this.http.get<Category>(`/categories/${categoryId}`);
  }
}
