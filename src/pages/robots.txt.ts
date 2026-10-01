import type { APIContext } from 'astro';

// Preview deployments block crawling; production points crawlers at the sitemap.
export function GET(context: APIContext): Response {
  const sitemap = new URL('/sitemap-index.xml', context.site ?? 'http://localhost:4321').href;
  const body = __NOINDEX__
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
