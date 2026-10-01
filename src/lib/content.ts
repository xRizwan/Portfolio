/**
 * Build-time content helpers. Pure functions over plain entry shapes so the publication rules
 * (draft exclusion, ordering, duplicate detection) can be unit-tested without Astro.
 */

export interface PublishableEntry {
  id: string;
  data: { draft: boolean; pubDate: Date };
}

/** Drafts are visible in `astro dev` but never in production builds. */
export function isPublished(entry: PublishableEntry, includeDrafts = false): boolean {
  return includeDrafts || !entry.data.draft;
}

export function publishedEntries<T extends PublishableEntry>(
  entries: T[],
  includeDrafts = false,
): T[] {
  return entries.filter((entry) => isPublished(entry, includeDrafts));
}

/** Newest first; ties keep a stable alphabetical order by id. */
export function sortByDate<T extends PublishableEntry>(entries: T[]): T[] {
  return [...entries].sort(
    (a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime() || a.id.localeCompare(b.id),
  );
}

/** Returns ids that appear more than once (for example the same slug in two collections). */
export function duplicateIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }
  return [...duplicates];
}

/** Splits a headline written with `\n` into lines for rendering with <br>. */
export function headlineLines(headline: string): string[] {
  return headline
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export const articleHref = (id: string) => `/blog/${id}/`;
export const projectHref = (id: string) => `/work/${id}/`;
