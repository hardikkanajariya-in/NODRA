"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  graphId: string;
  label?: string;
};

export function GraphSwitchButton({ graphId, label = "Switch" }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function switchGraph() {
    setLoading(true);
    try {
      await fetch("/api/graphs/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ graphId }),
      });
      router.push("/journal");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      className="text-sm text-[var(--nodra-link)]"
      onClick={switchGraph}
      disabled={loading}
    >
      {loading ? "…" : label}
    </button>
  );
}
