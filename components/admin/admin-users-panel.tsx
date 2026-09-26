"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type {
  AdminGraphSummary,
  AdminUserDirectoryEntry,
} from "@/lib/admin/directory";

type Props = {
  users: AdminUserDirectoryEntry[];
  orphanGraphs: AdminGraphSummary[];
  usernames: string[];
};

function GraphOwnerTransfer({
  graph,
  usernames,
  onDone,
}: {
  graph: AdminGraphSummary;
  usernames: string[];
  onDone: () => void;
}) {
  const [username, setUsername] = useState(graph.ownerUsername ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/graphs/${graph.id}/owner`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not update owner");
        return;
      }
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void submit(e)}
      className="mt-1 flex flex-wrap items-center gap-2 text-xs"
    >
      <span className="font-medium">{graph.name}</span>
      <span className="text-[var(--nodra-muted)]">({graph.slug})</span>
      <input
        list={`owners-${graph.id}`}
        className="nodra-input max-w-[8rem] py-1 text-xs"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="owner username"
      />
      <datalist id={`owners-${graph.id}`}>
        {usernames.map((u) => (
          <option key={u} value={u} />
        ))}
      </datalist>
      <button
        type="submit"
        className="rounded border border-[var(--nodra-border)] px-2 py-1"
        disabled={busy || !username.trim()}
      >
        Set owner
      </button>
      {error && <span className="text-[var(--nodra-danger)]">{error}</span>}
    </form>
  );
}

export function AdminUsersPanel({
  users: initialUsers,
  orphanGraphs: initialOrphans,
  usernames,
}: Props) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [orphanGraphs, setOrphanGraphs] = useState(initialOrphans);

  async function reload() {
    const res = await fetch("/api/admin/users");
    if (!res.ok) return;
    const data = (await res.json()) as {
      users: AdminUserDirectoryEntry[];
      orphanGraphs: AdminGraphSummary[];
    };
    setUsers(data.users);
    setOrphanGraphs(data.orphanGraphs);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {orphanGraphs.length > 0 && (
        <section className="rounded-md border border-amber-500/40 bg-amber-500/5 p-4">
          <h2 className="text-sm font-semibold">Graphs without owner</h2>
          <p className="mt-1 text-xs text-[var(--nodra-muted)]">
            Assign an owner so users can access them.
          </p>
          <ul className="mt-3 space-y-2">
            {orphanGraphs.map((g) => (
              <li key={g.id}>
                <GraphOwnerTransfer
                  graph={g}
                  usernames={usernames}
                  onDone={() => void reload()}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold">
          Registered users ({users.length})
        </h2>
        <ul className="mt-4 space-y-4">
          {users.map((user) => (
            <li
              key={user.id}
              className="rounded-md border border-[var(--nodra-border)] p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium">{user.username}</span>
                <span className="text-xs text-[var(--nodra-muted)]">
                  Joined {new Date(user.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="mt-3">
                <p className="text-xs font-medium text-[var(--nodra-muted)]">
                  Owned graphs ({user.ownedGraphs.length})
                </p>
                {user.ownedGraphs.length === 0 ? (
                  <p className="mt-1 text-xs text-[var(--nodra-muted)]">None</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {user.ownedGraphs.map((g) => (
                      <li key={g.id}>
                        <GraphOwnerTransfer
                          graph={g}
                          usernames={usernames}
                          onDone={() => void reload()}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-3">
                <p className="text-xs font-medium text-[var(--nodra-muted)]">
                  Shared with them ({user.sharedGraphs.length})
                </p>
                {user.sharedGraphs.length === 0 ? (
                  <p className="mt-1 text-xs text-[var(--nodra-muted)]">None</p>
                ) : (
                  <ul className="mt-1 space-y-1 text-sm">
                    {user.sharedGraphs.map((g) => (
                      <li key={g.id}>
                        {g.name}{" "}
                        <span className="text-xs text-[var(--nodra-muted)]">
                          — owner: {g.ownerUsername ?? "unassigned"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
