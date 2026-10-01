// Validates content files before a build: `npm run validate:content`.
// Schema rules (required fields, types) are enforced by Astro during the build; this script
// covers cross-file rules. Exits non-zero when any problem is found.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { parse } from 'yaml';
import { validateContent, type ContentFile } from '../src/lib/validate.ts';

const root = process.cwd();
const collections = { articles: 'src/content/articles', projects: 'src/content/projects' } as const;

function readEntries(collection: keyof typeof collections): ContentFile[] {
  const directory = join(root, collections[collection]);
  return readdirSync(directory)
    .filter((name) => name.endsWith('.mdx') && !name.startsWith('_'))
    .map((name) => {
      const path = join(directory, name);
      const source = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
      const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(source);
      if (!match) throw new Error(`${relative(root, path)}: missing frontmatter`);
      const raw: unknown = parse(match[1] ?? '');
      const data = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
      for (const key of ['pubDate', 'updatedDate']) {
        const value = data[key];
        if (typeof value === 'string') data[key] = new Date(value);
      }
      return {
        collection,
        id: basename(name, '.mdx'),
        path: relative(root, path),
        data,
        body: match[2] ?? '',
      };
    });
}

const files = [...readEntries('articles'), ...readEntries('projects')];
const routes = new Set(['/', '/blog/', '/experience/', '/sitemap-index.xml']);
for (const file of files)
  routes.add(`/${file.collection === 'articles' ? 'blog' : 'work'}/${file.id}/`);

const problems = validateContent(files, {
  exists: (path) =>
    routes.has(path) || routes.has(`${path}/`) || existsSync(join(root, 'public', path)),
});

if (problems.length) {
  for (const problem of problems) console.error(`✖ ${problem.path}: ${problem.message}`);
  console.error(`\n${problems.length} content problem(s) found.`);
  process.exit(1);
}
console.log(`✓ ${files.length} content files checked; no problems found.`);
