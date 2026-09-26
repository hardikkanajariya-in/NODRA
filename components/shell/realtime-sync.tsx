"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  dispatchDocumentUpdated,
  dispatchPagesChanged,
  type DocumentUpdatedDetail,
} from "@/lib/realtime/client";
import type { RealtimeEvent } from "@/lib/realtime/types";
import { useAppActivity } from "./app-activity-context";

type Props = {
  graphId: string;
};

export function RealtimeSync({ graphId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { setActivePresence } = useAppActivity();
  const lastCatalogRef = useRef<string | null>(null);

  useEffect(() => {
    if (!graphId) return;

    const source = new EventSource("/api/realtime/stream");

    source.onmessage = (message) => {
      let event: RealtimeEvent;
      try {
        event = JSON.parse(message.data) as RealtimeEvent;
      } catch {
        return;
      }

      if (event.type === "presence") {
        setActivePresence(event.users);
        return;
      }

      if (event.type === "pages-changed") {
        if (lastCatalogRef.current === event.catalogRevision) return;
        lastCatalogRef.current = event.catalogRevision;
        dispatchPagesChanged({ catalogRevision: event.catalogRevision });
        router.refresh();
        return;
      }

      if (event.type === "document-updated") {
        const detail: DocumentUpdatedDetail = {
          pageId: event.pageId,
          updatedAt: event.updatedAt,
        };
        dispatchDocumentUpdated(detail);
        if (pathname === "/graph") {
          router.refresh();
        }
      }
    };

    return () => {
      source.close();
      setActivePresence([]);
    };
  }, [graphId, pathname, router, setActivePresence]);

  return null;
}
