import { describe, expect, it } from 'vitest';
import { duplicateIds, headlineLines, publishedEntries, sortByDate } from './content';
import { validateContent, type ContentFile } from './validate';

const entry = (id: string, date: string, draft = false) => ({
  id,
  data: { draft, pubDate: new Date(date) },
});

describe('publication rules', () => {
  it('excludes drafts from production listings', () => {
    const entries = [entry('live', '2026-10-01'), entry('wip', '2026-10-02', true)];
    expect(publishedEntries(entries).map((item) => item.id)).toEqual(['live']);
  });

  it('includes drafts only when explicitly asked (dev server)', () => {
    const entries = [entry('live', '2026-10-01'), entry('wip', '2026-10-02', true)];
    expect(publishedEntries(entries, true)).toHaveLength(2);
  });

  it('sorts newest first with a stable order for equal dates', () => {
    const entries = [entry('b', '2026-01-01'), entry('c', '2026-03-01'), entry('a', '2026-01-01')];
    expect(sortByDate(entries).map((item) => item.id)).toEqual(['c', 'a', 'b']);
  });

  it('reports each duplicated id once', () => {
    expect(duplicateIds(['a', 'b', 'a', 'a', 'c'])).toEqual(['a']);
  });

  it('splits headlines on explicit line breaks', () => {
    expect(headlineLines('The gradients were right.\nThe network still failed.')).toEqual([
      'The gradients were right.',
      'The network still failed.',
    ]);
  });
});

describe('content validation', () => {
  const base: ContentFile = {
    collection: 'articles',
    id: 'sample',
    path: 'src/content/articles/sample.mdx',
    data: { pubDate: new Date('2026-10-01'), toc: [{ id: 'intro', label: 'Intro' }] },
    body: '<h2 id="intro">Intro</h2>\n<a href="/documents/file.pdf">PDF</a>',
  };
  const exists = (known: string[]) => ({ exists: (path: string) => known.includes(path) });

  it('accepts a valid entry', () => {
    expect(validateContent([base], exists(['/documents/file.pdf']))).toEqual([]);
  });

  it('flags table-of-contents entries without a matching heading', () => {
    const file = { ...base, data: { ...base.data, toc: [{ id: 'missing', label: 'Missing' }] } };
    expect(validateContent([file], exists(['/documents/file.pdf']))[0]?.message).toMatch(
      /missing heading id/,
    );
  });

  it('flags broken local links and assets, including frontmatter paths', () => {
    const file = { ...base, data: { ...base.data, diagram: { src: '/diagrams/nope.svg' } } };
    const messages = validateContent([file], exists([])).map((problem) => problem.message);
    expect(messages).toEqual(
      expect.arrayContaining([
        expect.stringMatching('/documents/file.pdf'),
        expect.stringMatching('/diagrams/nope.svg'),
      ]),
    );
  });

  it('flags the same slug in two collections', () => {
    const project: ContentFile = {
      ...base,
      collection: 'projects',
      path: 'src/content/projects/sample.mdx',
    };
    expect(validateContent([base, project], exists(['/documents/file.pdf']))[0]?.message).toMatch(
      /Duplicate slug/,
    );
  });

  it('flags an update dated before publication', () => {
    const file = { ...base, data: { ...base.data, updatedDate: new Date('2026-09-01') } };
    expect(validateContent([file], exists(['/documents/file.pdf']))[0]?.message).toMatch(
      /earlier than pubDate/,
    );
  });
});
