export const DOCUMENT_UPDATED_EVENT = "nodra:document-updated";
export const PAGES_CHANGED_EVENT = "nodra:pages-changed";

export type PagesChangedDetail = {
  catalogRevision: string;
};

export type DocumentUpdatedDetail = {
  pageId: string;
  updatedAt: string;
};

export function dispatchDocumentUpdated(detail: DocumentUpdatedDetail): void {
  window.dispatchEvent(
    new CustomEvent(DOCUMENT_UPDATED_EVENT, { detail }),
  );
}

export function dispatchPagesChanged(detail: PagesChangedDetail): void {
  window.dispatchEvent(new CustomEvent(PAGES_CHANGED_EVENT, { detail }));
}
