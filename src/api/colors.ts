import type { BrickLinkHttpClient } from "../client/client.js";
import type { Color } from "../client/types.js";

export class ColorsApi {
  constructor(private readonly http: BrickLinkHttpClient) {}

  list(): Promise<Color[]> {
    return this.http.get<Color[]>("/colors");
  }

  get(colorId: number): Promise<Color> {
    return this.http.get<Color>(`/colors/${colorId}`);
  }
}
