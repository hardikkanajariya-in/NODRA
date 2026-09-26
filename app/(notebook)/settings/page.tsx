import { getSession } from "@/lib/auth/session";
import { getActiveGraph } from "@/lib/graphs/service";
import { LogseqAssetsLink } from "@/components/settings/logseq-assets-link";
import { ChangePasswordForm } from "@/components/settings/change-password-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSession();
  let graphId = "";
  let graphName = "Active graph";

  if (session) {
    try {
      const graph = await getActiveGraph(session.userId);
      graphId = graph.id;
      graphName = graph.name;
    } catch {
      // no accessible graph
    }
  }

  return (
    <div className="nodra-content mx-auto max-w-2xl px-8 py-6">
      <h1 className="nodra-page-title mb-4">Settings</h1>
      <div className="space-y-4">
        {session && (
          <div className="rounded-md border border-[var(--nodra-border)] p-4 text-sm">
            <p className="text-[var(--nodra-muted)]">Signed in as</p>
            <p className="mt-1 font-medium">{session.username}</p>
          </div>
        )}
        <ChangePasswordForm />
        <LogseqAssetsLink graphId={graphId} graphName={graphName} />
      </div>
    </div>
  );
}
