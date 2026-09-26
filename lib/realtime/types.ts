export type PresenceUser = {
  userId: string;
  username: string;
};

export type RealtimeEvent =
  | {
      type: "document-updated";
      pageId: string;
      updatedAt: string;
    }
  | {
      type: "pages-changed";
      catalogRevision: string;
    }
  | {
      type: "presence";
      users: PresenceUser[];
    };
