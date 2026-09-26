"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PasswordInput } from "@/components/ui/password-input";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
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
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Invalid username or password");
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
          Sign in with your username and password.
        </p>
        <label className="mt-6 block text-sm" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          type="text"
          className="nodra-input mt-1 w-full"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />
        <label className="mt-4 block text-sm" htmlFor="password">
          Password
        </label>
        <PasswordInput
          id="password"
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
        <p className="mt-4 text-center text-sm text-[var(--nodra-muted)]">
          No account?{" "}
          <Link href="/register" className="text-[var(--nodra-link)]">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}
