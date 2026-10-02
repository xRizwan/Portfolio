import { getCollection, type CollectionEntry } from 'astro:content';
import { articleHref, projectHref, publishedEntries, sortByDate } from './content';

// Drafts appear only in the dev server; every production listing, route, feed, and sitemap
// goes through these helpers.
const includeDrafts = import.meta.env.DEV;

export async function getArticles(): Promise<CollectionEntry<'articles'>[]> {
  return sortByDate(publishedEntries(await getCollection('articles'), includeDrafts));
}

export async function getProjects(): Promise<CollectionEntry<'projects'>[]> {
  return sortByDate(publishedEntries(await getCollection('projects'), includeDrafts));
}

export interface BlogListing {
  href: string;
  pubDate: Date;
  card: NonNullable<CollectionEntry<'projects'>['data']['blog']>;
}

/**
 * Articles plus the case studies that are written up as blog entries, newest first. Entries
 * marked `last` go after the rest.
 */
export async function getBlogListings(): Promise<BlogListing[]> {
  const articles = (await getArticles()).map((entry) => ({
    href: articleHref(entry.id),
    pubDate: entry.data.pubDate,
    card: entry.data.blog,
  }));
  const projects = (await getProjects()).flatMap((entry) =>
    entry.data.blog
      ? [{ href: projectHref(entry.id), pubDate: entry.data.pubDate, card: entry.data.blog }]
      : [],
  );
  // Keep the article first when dates tie, matching the selected design's order.
  return [...articles, ...projects].sort(
    (a, b) =>
      Number(a.card.last ?? false) - Number(b.card.last ?? false) ||
      b.pubDate.getTime() - a.pubDate.getTime(),
  );
}
