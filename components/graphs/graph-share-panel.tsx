"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ShareRow = {
  id: string;
  userId: string;
  username: string;
};

type Props = {
  graphId: string;
  isOwner: boolean;
  initialShares: ShareRow[];
};

export function GraphSharePanel({ graphId, isOwner, initialShares }: Props) {
  const router = useRouter();
  const [shares, setShares] = useState(initialShares);
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOwner) {
    return (
      <p className="text-xs text-[var(--nodra-muted)]">
        Shared with you — only the owner can manage access.
      </p>
    );
  }

  async function refreshShares() {
    const res = await fetch(`/api/graphs/${graphId}/shares`);
    if (!res.ok) return;
    const data = (await res.json()) as { shares: ShareRow[] };
    setShares(data.shares);
  }

  async function addShare(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/graphs/${graphId}/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not share");
        return;
      }
      setUsername("");
      await refreshShares();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function removeShare(userId: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/graphs/${graphId}/shares`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Could not remove share");
        return;
      }
      await refreshShares();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-2 space-y-2 border-t border-[var(--nodra-border)] pt-2">
      <p className="text-xs font-medium text-[var(--nodra-muted)]">Sharing</p>
      {shares.length > 0 && (
        <ul className="space-y-1 text-sm">
          {shares.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-2">
              <span>{s.username}</span>
              <button
                type="button"
                className="text-xs text-[var(--nodra-link)]"
                onClick={() => removeShare(s.userId)}
                disabled={loading}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={addShare} className="flex flex-wrap items-end gap-2">
        <label className="min-w-[8rem] flex-1 text-xs">
          Add user by username
          <input
            className="nodra-input mt-1 w-full text-sm"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
          />
        </label>
        <button
          type="submit"
          className="nodra-btn-primary text-sm"
          disabled={loading || !username.trim()}
        >
          Share
        </button>
      </form>
      {error && (
        <p className="text-xs text-[var(--nodra-danger)]">{error}</p>
      )}
    </div>
  );
}
