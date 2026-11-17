// Entry point for the home page (the pop-up book). The book engine goes first: the other parts
// ask it which presentation is running.
import { initBook } from './book';
import { initLife } from './life';
import { initCertificates, initFlaps, initRoleSheet, initWheel } from './parts';

function start(): void {
  const book = initBook();
  initFlaps(book.mode);
  initWheel();
  initRoleSheet(book.mode);
  initCertificates(book.mode);
  initLife(book.velocity);
}

// Start after the first paint. The presentation class is already set by the inline script in
// the page head, so the cover is laid out correctly without this; deferring the engine's
// measuring lets the cover paint first instead of waiting for it (it was most of the home
// page's simulated mobile LCP).
requestAnimationFrame(() => setTimeout(start, 0));
