// Scroll reactions shared by the sections below the opening: things that settle into place when
// first seen, props that drift at their own speed, and the picture books that slide open.
import { motionAllowed, onMotionChange, selectAll } from '../../../scripts/motion';
import { clamp, onFrame } from './ticker';

export function initReveals(): void {
  const reveals = selectAll('[data-cat-reveal]', HTMLElement);
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-seen');
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
  );
  reveals.forEach((element) => observer.observe(element));

  const drifters = selectAll('[data-cat-parallax]', HTMLElement);
  const books = selectAll('[data-cat-book]', HTMLElement);

  onFrame(({ viewH }) => {
    for (const drifter of drifters) {
      const box = drifter.getBoundingClientRect();
      if (box.bottom < -200 || box.top > viewH + 200) continue;
      const factor = Number(drifter.dataset.catParallax) || 0;
      const offset = (box.top + box.height / 2 - viewH / 2) * factor;
      drifter.style.translate = `0 ${offset.toFixed(1)}px`;
    }
    for (const book of books) {
      const box = book.getBoundingClientRect();
      if (box.bottom < -100 || box.top > viewH + 100) continue;
      // Closed as it comes up from the bottom of the screen, fully open by the middle.
      const q = clamp((viewH * 0.96 - box.top) / (viewH * 0.36));
      book.style.setProperty('--q', q.toFixed(3));
    }
  });

  onMotionChange(() => {
    if (motionAllowed()) return;
    drifters.forEach((drifter) => drifter.style.removeProperty('translate'));
    books.forEach((book) => book.style.removeProperty('--q'));
  });
}
