import slugify from "slugify";

export function pageSlugFromName(name: string): string {
  return slugify(name, { lower: true, strict: true, trim: true });
}

export function journalSlugFromDate(date: string): string {
  return date;
}
