import type { RealtimeEvent } from "./types";

type Listener = (event: RealtimeEvent) => void;

const globalHub = globalThis as typeof globalThis & {
  __nodraRealtimeHub?: Map<string, Set<Listener>>;
};

function graphListeners(graphId: string): Set<Listener> {
  if (!globalHub.__nodraRealtimeHub) {
    globalHub.__nodraRealtimeHub = new Map();
  }
  let set = globalHub.__nodraRealtimeHub.get(graphId);
  if (!set) {
    set = new Set();
    globalHub.__nodraRealtimeHub.set(graphId, set);
  }
  return set;
}

export function subscribeGraph(graphId: string, listener: Listener): () => void {
  const set = graphListeners(graphId);
  set.add(listener);
  return () => {
    set.delete(listener);
    if (set.size === 0) {
      globalHub.__nodraRealtimeHub?.delete(graphId);
    }
  };
}

export function publishGraph(graphId: string, event: RealtimeEvent): void {
  for (const listener of graphListeners(graphId)) {
    try {
      listener(event);
    } catch {
      // ignore broken subscriber
    }
  }
}
