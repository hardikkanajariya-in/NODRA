export const DOCUMENT_UPDATED_EVENT = "nodra:document-updated";

export type DocumentUpdatedDetail = {
  pageId: string;
  updatedAt: string;
};

export function dispatchDocumentUpdated(detail: DocumentUpdatedDetail): void {
  window.dispatchEvent(
    new CustomEvent(DOCUMENT_UPDATED_EVENT, { detail }),
  );
}
