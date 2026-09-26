"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ChangePasswordForm() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not update password");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(true);
      router.refresh();
    } catch {
      setError("Could not update password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-md border border-[var(--nodra-border)] p-4">
      <h2 className="text-sm font-medium">Change password</h2>
      <label className="block text-sm">
        Current password
        <input
          type="password"
          className="nodra-input mt-1 w-full"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
        />
      </label>
      <label className="block text-sm">
        New password
        <input
          type="password"
          className="nodra-input mt-1 w-full"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
        />
      </label>
      <label className="block text-sm">
        Confirm new password
        <input
          type="password"
          className="nodra-input mt-1 w-full"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
        />
      </label>
      {error && (
        <p className="text-sm text-[var(--nodra-danger)]">{error}</p>
      )}
      {success && (
        <p className="text-sm text-[var(--nodra-muted)]">Password updated.</p>
      )}
      <button type="submit" className="nodra-btn-primary" disabled={loading}>
        {loading ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}
