"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("Invalid password");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Could not sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="nodra-login flex min-h-screen items-center justify-center p-6">
      <form
        onSubmit={onSubmit}
        className="nodra-login-card w-full max-w-sm rounded-lg border p-6"
      >
        <h1 className="text-xl font-semibold">NODRA</h1>
        <p className="mt-1 text-sm text-[var(--nodra-muted)]">
          Self-hosted block notebook. Enter your access password.
        </p>
        <label className="mt-6 block text-sm" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          className="nodra-input mt-1 w-full"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        {error && (
          <p className="mt-2 text-sm text-[var(--nodra-danger)]">{error}</p>
        )}
        <button
          type="submit"
          className="nodra-btn-primary mt-4 w-full"
          disabled={loading}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
