# UI and accessibility review (manual)

Run against `npm run build && npm run preview`. Record which items were actually checked.

- **Viewports:** 375×667, 390×844, 768×1024, 1440×900, 1536×730. No horizontal scrolling. The
  home hero fits the first screen on tablet and desktop.
- **Keyboard:** skip link, visible focus on every control, logical tab order, the mobile menu,
  the home page's header tabs (focus inside a closed spread opens it), the skills wheel (arrow
  keys), and the certificate viewer (opens, Escape closes, focus returns).
- **Reduced motion (OS setting):** the home book is shown as flat, fully open pages; the blog
  cats and other CSS animations hold still; all content stays visible.
- **Fallbacks:** without JavaScript the home page is a stack of open pages (every skill group,
  project, role and certificate readable), and articles and case studies are complete.
- **Content:** image alternatives, one `h1`, heading order, link text, contrast of chips and
  muted text, long titles and tables on small screens.
