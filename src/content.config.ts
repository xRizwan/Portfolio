import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** A table-of-contents entry; `id` must match a heading id in the body (checked by validation). */
const tocEntry = z.object({ id: z.string().min(1), label: z.string().min(1) });

/** How an entry appears on the blog index. */
const blogCard = z.object({
  category: z.enum(['ml', 'architecture']),
  label: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  art: z.enum(['formula', 'fraud-diagram', 'pauc']),
});

const articles = defineCollection({
  loader: glob({ pattern: '**/[^_]*.mdx', base: './src/content/articles' }),
  schema: z.object({
    title: z.string().min(1),
    /** Page heading; line breaks are written as `\n`. */
    headline: z.string().min(1),
    description: z.string().min(1).max(200),
    /** Lead paragraph shown under the headline. */
    intro: z.string().min(1),
    eyebrow: z.string().min(1),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    topics: z.string().min(1),
    toc: z.array(tocEntry).min(1),
    source: z.object({ label: z.string(), url: z.url() }).optional(),
    blog: blogCard,
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/[^_]*.mdx', base: './src/content/projects' }),
  schema: z.object({
    title: z.string().min(1),
    headline: z.string().min(1),
    description: z.string().min(1).max(220),
    intro: z.string().min(1),
    eyebrow: z.string().min(1),
    status: z.enum(['completed', 'ongoing', 'design-study']),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    meta: z.array(z.string()).default([]),
    toc: z.array(tocEntry).min(1),
    tocLinks: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
    backLink: z.object({ label: z.string(), href: z.string() }),
    diagram: z
      .object({ src: z.string().startsWith('/'), alt: z.string().min(1), caption: z.string() })
      .optional(),
    blog: blogCard.optional(),
  }),
});

export const collections = { articles, projects };
