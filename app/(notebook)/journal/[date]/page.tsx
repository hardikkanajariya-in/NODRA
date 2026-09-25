import { notFound } from "next/navigation";
import { getOrCreateJournal } from "@/lib/pages/service";
import { PageTitle } from "@/components/shell/page-title";
import { PageEditor } from "@/components/editor/page-editor";

type Props = { params: Promise<{ date: string }> };

export default async function JournalDayPage({ params }: Props) {
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

  let page;
  try {
    page = await getOrCreateJournal(date);
  } catch {
    notFound();
  }

  if (!page?.document) notFound();

  return (
    <div className="nodra-content mx-auto max-w-3xl p-6">
      <PageTitle pageId={page.id} name={page.name} journal />
      <PageEditor
        pageId={page.id}
        initialContent={page.document.contentJson as Record<string, unknown>}
      />
    </div>
  );
}
