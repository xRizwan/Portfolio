// Entry point for the Pop-up page. The book engine goes first: the other parts ask it which
// presentation is running.
import { initBook } from './book';
import { initLife } from './life';
import { initCertificates, initFlaps, initRoleSheet, initWheel } from './parts';

const book = initBook();
initFlaps(book.mode);
initWheel();
initRoleSheet(book.mode);
initCertificates(book.mode);
initLife(book.velocity);
