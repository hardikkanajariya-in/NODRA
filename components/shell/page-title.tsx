"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  pageId: string;
  name: string;
  journal?: boolean;
};

export function PageTitle({ pageId, name, journal }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(name);
  const [editing, setEditing] = useState(false);

  async function commit() {
    setEditing(false);
    if (journal || title.trim() === name) return;

    const res = await fetch(`/api/pages/${pageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: title.trim() }),
    });
    if (res.ok) {
      const updated = (await res.json()) as { slug: string };
      router.push(`/pages/${updated.slug}`);
      router.refresh();
    }
  }

  return (
    <h1 className="nodra-page-title mb-6">
      {editing && !journal ? (
        <input
          className="nodra-title-input w-full"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
          }}
          autoFocus
        />
      ) : (
        <button
          type="button"
          className="text-left"
          onClick={() => !journal && setEditing(true)}
        >
          {title}
        </button>
      )}
    </h1>
  );
}
