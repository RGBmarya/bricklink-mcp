import type { BrickLinkHttpClient } from "../client/client.js";
import type { CreateFeedbackInput, Direction, Feedback } from "../client/types.js";

export class FeedbackApi {
  constructor(private readonly http: BrickLinkHttpClient) {}

  list(direction: Direction = "in"): Promise<Feedback[]> {
    return this.http.get<Feedback[]>("/feedback", { direction });
  }

  get(feedbackId: number): Promise<Feedback> {
    return this.http.get<Feedback>(`/feedback/${feedbackId}`);
  }

  create(body: CreateFeedbackInput): Promise<Feedback> {
    return this.http.post<Feedback>("/feedback", body);
  }

  reply(feedbackId: number, reply: string): Promise<unknown> {
    return this.http.post(`/feedback/${feedbackId}/reply`, { reply });
  }
}
