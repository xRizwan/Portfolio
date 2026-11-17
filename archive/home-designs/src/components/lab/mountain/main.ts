// Entry point for the "Summit" trial page.
import { motionAllowed, onMotionChange, selectAll } from '../../../scripts/motion';
import { initGear } from './gear';
import { initLife } from './life';
import { initOpening } from './opening';
import { initRegister } from './register';

/** Journal pages settle into place as they scroll into view; all at once without motion. */
function initReveals(): void {
  const items = selectAll('[data-reveal]', HTMLElement);
  const showAll = (): void => items.forEach((item) => item.classList.add('is-in'));
  if (!('IntersectionObserver' in window) || !motionAllowed()) {
    showAll();
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  items.forEach((item) => observer.observe(item));
  onMotionChange(() => {
    if (!motionAllowed()) showAll();
  });
}

initOpening();
initReveals();
initLife();
initGear();
initRegister();
