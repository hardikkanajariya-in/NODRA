import { publishGraph } from "./hub";
import type { PresenceUser } from "./types";

const globalPresence = globalThis as typeof globalThis & {
  __nodraPresence?: Map<
    string,
    Map<string, { username: string; connectionIds: Set<string> }>
  >;
};

function usersForGraph(graphId: string): Map<
  string,
  { username: string; connectionIds: Set<string> }
> {
  if (!globalPresence.__nodraPresence) {
    globalPresence.__nodraPresence = new Map();
  }
  let graphMap = globalPresence.__nodraPresence.get(graphId);
  if (!graphMap) {
    graphMap = new Map();
    globalPresence.__nodraPresence.set(graphId, graphMap);
  }
  return graphMap;
}

function presenceList(
  graphMap: Map<string, { username: string; connectionIds: Set<string> }>,
): PresenceUser[] {
  return [...graphMap.entries()].map(([userId, entry]) => ({
    userId,
    username: entry.username,
  }));
}

function publishPresence(
  graphId: string,
  graphMap: Map<string, { username: string; connectionIds: Set<string> }>,
): PresenceUser[] {
  const users = presenceList(graphMap);
  publishGraph(graphId, { type: "presence", users });
  return users;
}

export function registerConnection(
  graphId: string,
  connectionId: string,
  userId: string,
  username: string,
): PresenceUser[] {
  const graphMap = usersForGraph(graphId);
  let entry = graphMap.get(userId);
  if (!entry) {
    entry = { username, connectionIds: new Set() };
    graphMap.set(userId, entry);
  } else {
    entry.username = username;
  }
  entry.connectionIds.add(connectionId);
  return publishPresence(graphId, graphMap);
}

export function unregisterConnection(
  graphId: string,
  connectionId: string,
): void {
  const graphMap = globalPresence.__nodraPresence?.get(graphId);
  if (!graphMap) return;

  for (const [userId, entry] of graphMap) {
    if (!entry.connectionIds.delete(connectionId)) continue;
    if (entry.connectionIds.size === 0) {
      graphMap.delete(userId);
    }
    break;
  }

  if (graphMap.size === 0) {
    globalPresence.__nodraPresence?.delete(graphId);
    publishGraph(graphId, { type: "presence", users: [] });
    return;
  }

  publishPresence(graphId, graphMap);
}
