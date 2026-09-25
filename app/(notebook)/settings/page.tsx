import { LogseqAssetsLink } from "@/components/settings/logseq-assets-link";

export default function SettingsPage() {
  return (
    <div className="nodra-content mx-auto max-w-2xl px-8 py-6">
      <h1 className="nodra-page-title mb-4">Settings</h1>
      <div className="space-y-4">
        <LogseqAssetsLink />
      </div>
    </div>
  );
}
