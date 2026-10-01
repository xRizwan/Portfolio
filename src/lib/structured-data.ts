import { site } from '../data/site';

/** JSON-LD builders. Values must stay consistent with what the page visibly shows. */

type JsonLd = Record<string, unknown>;

export function personNode(origin: URL): JsonLd {
  return {
    '@type': 'Person',
    '@id': new URL('/#person', origin).href,
    name: site.name,
    alternateName: site.shortName,
    jobTitle: site.jobTitle,
    email: `mailto:${site.email}`,
    url: new URL('/', origin).href,
    image: new URL(site.ogImage, origin).href,
    sameAs: [site.github, site.linkedin],
  };
}

export function websiteNode(origin: URL): JsonLd {
  return {
    '@type': 'WebSite',
    '@id': new URL('/#website', origin).href,
    url: new URL('/', origin).href,
    name: site.name,
    inLanguage: site.language,
    publisher: { '@id': new URL('/#person', origin).href },
  };
}

export function profilePage(origin: URL, path: string): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      websiteNode(origin),
      {
        '@type': 'ProfilePage',
        url: new URL(path, origin).href,
        mainEntity: personNode(origin),
      },
    ],
  };
}

interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbs(origin: URL, crumbs: Crumb[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: new URL(crumb.path, origin).href,
    })),
  };
}

interface WritingOptions {
  type: 'BlogPosting' | 'Article';
  title: string;
  description: string;
  path: string;
  published: Date;
  modified?: Date;
}

export function writing(origin: URL, options: WritingOptions): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': options.type,
    headline: options.title,
    description: options.description,
    url: new URL(options.path, origin).href,
    mainEntityOfPage: new URL(options.path, origin).href,
    datePublished: options.published.toISOString(),
    dateModified: (options.modified ?? options.published).toISOString(),
    image: new URL(site.ogImage, origin).href,
    author: personNode(origin),
    inLanguage: site.language,
  };
}
