export const JOURNAL_OUTLINE_SET_COLLAPSED_EVENT =
  "nodra:journal-outline-set-collapsed";

export type JournalOutlineSetCollapsedDetail = {
  pageId: string;
  collapsed: boolean;
};

export function dispatchJournalOutlineSetCollapsed(
  detail: JournalOutlineSetCollapsedDetail,
): void {
  window.dispatchEvent(
    new CustomEvent(JOURNAL_OUTLINE_SET_COLLAPSED_EVENT, { detail }),
  );
}
