import { publishGraph } from "./hub";

const globalPresence = globalThis as typeof globalThis & {
  __nodraPresence?: Map<string, Set<string>>;
};

function connectionsFor(graphId: string): Set<string> {
  if (!globalPresence.__nodraPresence) {
    globalPresence.__nodraPresence = new Map();
  }
  let set = globalPresence.__nodraPresence.get(graphId);
  if (!set) {
    set = new Set();
    globalPresence.__nodraPresence.set(graphId, set);
  }
  return set;
}

export function registerConnection(
  graphId: string,
  connectionId: string,
): number {
  const set = connectionsFor(graphId);
  set.add(connectionId);
  const activeUsers = set.size;
  publishGraph(graphId, { type: "presence", activeUsers });
  return activeUsers;
}

export function unregisterConnection(
  graphId: string,
  connectionId: string,
): void {
  const set = connectionsFor(graphId);
  if (!set.delete(connectionId)) return;
  if (set.size === 0) {
    globalPresence.__nodraPresence?.delete(graphId);
  }
  publishGraph(graphId, { type: "presence", activeUsers: set.size });
}
