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
      activeUsers: number;
    };
