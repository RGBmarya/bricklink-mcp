import type { BrickLinkHttpClient } from "../client/client.js";
import type { MemberNote, MemberRating } from "../client/types.js";

export class MembersApi {
  constructor(private readonly http: BrickLinkHttpClient) {}

  getRating(username: string): Promise<MemberRating> {
    return this.http.get<MemberRating>(
      `/members/${encodeURIComponent(username)}/ratings`,
    );
  }

  getNote(username: string): Promise<MemberNote> {
    return this.http.get<MemberNote>(`/members/${encodeURIComponent(username)}/notes`);
  }

  createNote(username: string, noteText: string): Promise<MemberNote> {
    return this.http.post<MemberNote>(
      `/members/${encodeURIComponent(username)}/notes`,
      { note_text: noteText },
    );
  }

  updateNote(username: string, noteText: string): Promise<MemberNote> {
    return this.http.put<MemberNote>(
      `/members/${encodeURIComponent(username)}/notes`,
      { note_text: noteText },
    );
  }

  deleteNote(username: string): Promise<unknown> {
    return this.http.delete(`/members/${encodeURIComponent(username)}/notes`);
  }
}
