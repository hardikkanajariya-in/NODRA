import { listPages } from "@/lib/pages/service";
import { LogseqShell } from "@/components/shell/logseq-shell";

export const dynamic = "force-dynamic";

export default async function NotebookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let pages: { id: string; name: string; slug: string }[] = [];
  try {
    pages = await listPages();
  } catch {
    pages = [];
  }

  return <LogseqShell pages={pages}>{children}</LogseqShell>;
}
