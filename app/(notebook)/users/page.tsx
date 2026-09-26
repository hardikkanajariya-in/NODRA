import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { isSupervisorSession } from "@/lib/auth/supervisor";
import {
  listAdminUserDirectory,
  listOrphanGraphs,
} from "@/lib/admin/directory";
import { AdminUsersPanel } from "@/components/admin/admin-users-panel";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!isSupervisorSession(session)) {
    redirect("/journal");
  }

  const [users, orphanGraphs] = await Promise.all([
    listAdminUserDirectory(),
    listOrphanGraphs(),
  ]);

  const usernames = users.map((u) => u.username);

  return (
    <div className="nodra-content mx-auto max-w-3xl px-8 py-6">
      <h1 className="nodra-page-title mb-2">Users</h1>
      <p className="mb-6 text-sm text-[var(--nodra-muted)]">
        Overview of registered accounts and graph ownership. Available only to the
        account configured as supervisor on this instance (
        <code className="text-[11px]">SUPERVISOR_USERNAME</code> in server env).
      </p>
      <AdminUsersPanel
        users={users}
        orphanGraphs={orphanGraphs}
        usernames={usernames}
      />
    </div>
  );
}
