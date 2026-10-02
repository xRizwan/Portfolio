# SEO and performance review

- **Initial HTML** contains the page's text, headings, and links (view source, not DevTools).
- **Metadata:** unique title and description, canonical URL on the production origin, Open
  Graph/Twitter image, and `noindex` only on preview deployments.
- **Structured data:** validate the JSON-LD (WebSite, ProfilePage/Person, BlogPosting, Article,
  BreadcrumbList) with a structured-data validator. It must match the visible content.
- **Discovery:** `/sitemap-index.xml` lists only published pages, `/robots.txt` points to it,
  and unknown URLs return a real 404.
- **Performance:** run mobile Lighthouse on `/`, one article, and one case study against a
  production build. Targets: accessibility and SEO 100. There is no fixed performance score
  target; the home page's 3D scenes are an accepted cost (about 80-87 on mobile). Record the
  scores and revision. Three.js must load only on the home page, after the content.
- Rankings, rich results, and AI citations cannot be promised; never report them as achieved.
