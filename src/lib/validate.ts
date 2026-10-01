import { duplicateIds } from './content.ts';

/**
 * Content checks that Astro's schemas cannot express: table-of-contents targets, local links
 * and assets, duplicate slugs, and date order. Pure functions over parsed files so they can be
 * unit-tested; scripts/validate-content.ts reads the files and reports the problems.
 */

export interface ContentFile {
  collection: 'articles' | 'projects';
  /** Entry id, which is also the URL slug. */
  id: string;
  path: string;
  data: Record<string, unknown>;
  body: string;
}

export interface Problem {
  path: string;
  message: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Heading ids written as `id="..."` in the MDX body. */
export function bodyIds(body: string): Set<string> {
  return new Set([...body.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1] ?? ''));
}

/** Root-relative links and sources in the body and frontmatter (`/path`, not `//host`). */
export function localReferences(file: ContentFile): string[] {
  const fromBody = [...file.body.matchAll(/\b(?:href|src)="(\/[^/"][^"]*|\/)"/g)].map(
    (match) => match[1] ?? '',
  );
  const fromData: string[] = [];
  const visit = (value: unknown): void => {
    if (typeof value === 'string' && /^\/(?!\/)/.test(value)) fromData.push(value);
    else if (Array.isArray(value)) value.forEach(visit);
    else if (isRecord(value)) Object.values(value).forEach(visit);
  };
  visit(file.data);
  return [...fromBody, ...fromData];
}

export interface ValidationContext {
  /** Returns true when a root-relative path is served (a public file or a generated route). */
  exists(path: string): boolean;
}

export function validateContent(files: ContentFile[], context: ValidationContext): Problem[] {
  const problems: Problem[] = [];

  for (const id of duplicateIds(files.map((file) => file.id))) {
    const paths = files.filter((file) => file.id === id).map((file) => file.path);
    problems.push({ path: paths.join(', '), message: `Duplicate slug "${id}" across collections` });
  }

  for (const file of files) {
    const ids = bodyIds(file.body);
    const toc = Array.isArray(file.data.toc) ? file.data.toc : [];
    for (const item of toc) {
      const target = isRecord(item) && typeof item.id === 'string' ? item.id : '';
      if (!ids.has(target)) {
        problems.push({
          path: file.path,
          message: `Table of contents points at missing heading id "${target}"`,
        });
      }
    }

    for (const reference of localReferences(file)) {
      const path = reference.split(/[?#]/)[0] ?? reference;
      if (!context.exists(path))
        problems.push({ path: file.path, message: `Broken local link or asset "${reference}"` });
    }

    const published = file.data.pubDate;
    const updated = file.data.updatedDate;
    if (published instanceof Date && updated instanceof Date && updated < published) {
      problems.push({ path: file.path, message: 'updatedDate is earlier than pubDate' });
    }
    if (!(published instanceof Date) || Number.isNaN(published.getTime())) {
      problems.push({ path: file.path, message: 'pubDate is missing or not a valid date' });
    }
  }
  return problems;
}
