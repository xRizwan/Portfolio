import { select, selectAll } from './motion';

// Filter buttons are an enhancement: every entry is a plain link in the initial HTML.
const filters = selectAll('[data-filter]', HTMLButtonElement);
const entries = selectAll('[data-category]', HTMLElement);
const summary = select('.blog-count', HTMLElement);
const filterGroup = select('.blog-filters', HTMLElement);
if (filterGroup) filterGroup.hidden = false;

for (const button of filters) {
  button.addEventListener('click', () => {
    for (const other of filters) other.setAttribute('aria-pressed', String(other === button));
    const filter = button.dataset.filter ?? 'all';
    let count = 0;
    for (const entry of entries) {
      entry.hidden = filter !== 'all' && entry.dataset.category !== filter;
      if (!entry.hidden) count += 1;
    }
    if (summary) summary.textContent = `${count} ${count === 1 ? 'article' : 'articles'}`;
  });
}
