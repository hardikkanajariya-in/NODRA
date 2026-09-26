import { getSession } from "@/lib/auth/session";
import { getActiveGraphId } from "@/lib/graphs/service";
import { pollGraphChanges } from "@/lib/realtime/poll-changes";
import { subscribeGraph } from "@/lib/realtime/hub";
import {
  registerConnection,
  unregisterConnection,
} from "@/lib/realtime/presence";
import type { RealtimeEvent } from "@/lib/realtime/types";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const POLL_MS = 2000;
const PING_MS = 25000;

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const graphId = await getActiveGraphId(session.userId);
  const connectionId = randomUUID();
  const encoder = new TextEncoder();
  let closed = false;
  let since = new Date();
  let catalogRevision: string | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: RealtimeEvent) => {
        if (closed) return;
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
        );
      };

      const users = registerConnection(
        graphId,
        connectionId,
        session.userId,
        session.username,
      );
      send({ type: "presence", users });

      const unsubscribe = subscribeGraph(graphId, send);

      void (async () => {
        try {
          const initial = await pollGraphChanges(graphId, since, null);
          catalogRevision = initial.catalogRevision;
          since = initial.nextSince;
        } catch {
          // polling will retry
        }
      })();

      const pollTimer = setInterval(() => {
        void (async () => {
          if (closed) return;
          try {
            const result = await pollGraphChanges(
              graphId,
              since,
              catalogRevision,
            );
            catalogRevision = result.catalogRevision;
            since = result.nextSince;
            for (const event of result.events) {
              send(event);
            }
          } catch {
            // transient DB errors; keep stream alive
          }
        })();
      }, POLL_MS);

      const pingTimer = setInterval(() => {
        if (closed) return;
        controller.enqueue(encoder.encode(": ping\n\n"));
      }, PING_MS);

      const onAbort = () => {
        closed = true;
        clearInterval(pollTimer);
        clearInterval(pingTimer);
        unsubscribe();
        unregisterConnection(graphId, connectionId);
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      request.signal.addEventListener("abort", onAbort, { once: true });
    },
    cancel() {
      closed = true;
      unregisterConnection(graphId, connectionId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
