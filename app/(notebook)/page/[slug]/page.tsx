import { notFound } from "next/navigation";
import { getPageBySlug } from "@/lib/pages/service";
import { PageTitle } from "@/components/shell/page-title";
import { PageEditor } from "@/components/editor/page-editor";

type Props = { params: Promise<{ slug: string }> };

export default async function NotebookPagePage({ params }: Props) {
  const { slug } = await params;
  let page;
  try {
    page = await getPageBySlug(slug);
  } catch {
    notFound();
  }

  if (!page || page.type === "journal" || !page.document) notFound();

  return (
    <div className="nodra-content mx-auto max-w-3xl p-6">
      <PageTitle pageId={page.id} name={page.name} />
      <PageEditor
        pageId={page.id}
        initialContent={page.document.contentJson as Record<string, unknown>}
      />
    </div>
  );
}
