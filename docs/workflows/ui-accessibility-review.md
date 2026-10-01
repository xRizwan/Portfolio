# UI and accessibility review (manual)

Run against `npm run build && npm run preview`. Record which items were actually checked.

- **Viewports:** 375×667, 390×844, 768×1024, 1440×900, 1536×730. No horizontal scrolling. The
  home hero fits the first screen on tablet and desktop.
- **Keyboard:** skip link, visible focus on every control, logical tab order, the mobile menu,
  note handles (arrow keys), and the certificate dialog (opens, Escape closes, focus returns).
- **Reduced motion and Pause motion:** particles, cats, yarn, and note arrival hold still; all
  content stays visible.
- **Fallbacks:** without JavaScript the notes, certificates, and articles are readable; without
  WebGL the framed photo and the flat title cat appear.
- **Content:** image alternatives, one `h1`, heading order, link text, contrast of chips and
  muted text, long titles and tables on small screens.
