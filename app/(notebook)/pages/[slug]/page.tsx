import { notFound } from "next/navigation";
import { getPageBySlug } from "@/lib/pages/service";
import { getActiveGraphId } from "@/lib/graphs/service";
import { ensureDocument, getErrorMessage } from "@/lib/pages/document";
import { ConnectionError } from "@/components/errors/connection-error";
import { PageTitle } from "@/components/shell/page-title";
import { PageEditor } from "@/components/editor/page-editor";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function NotebookPagePage({ params }: Props) {
  const { slug } = await params;

  let page;
  try {
    const graphId = await getActiveGraphId();
    page = await getPageBySlug(graphId, slug);
  } catch (error) {
    return <ConnectionError message={getErrorMessage(error)} />;
  }

  if (!page || page.type === "journal") {
    notFound();
  }

  try {
    if (!page.document) {
      await ensureDocument(page.id);
      const graphId = await getActiveGraphId();
      page = await getPageBySlug(graphId, slug);
    }

    if (!page?.document) {
      throw new Error("Page document could not be loaded.");
    }

    const loaded = page;

    return (
      <div className="nodra-content mx-auto max-w-3xl px-8 py-6">
        <PageTitle pageId={loaded.id} name={loaded.name} />
        <PageEditor
          pageId={loaded.id}
          initialContent={loaded.document.contentJson as Record<string, unknown>}
        />
      </div>
    );
  } catch (error) {
    return <ConnectionError message={getErrorMessage(error)} />;
  }
}
