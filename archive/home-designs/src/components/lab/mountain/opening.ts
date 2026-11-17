// Pinned opening: maps the scroll through the tall opening section to --p (0 to 1). The CSS in
// MtOpening.astro turns --p into the three stages (sunrise, the walk, the route).
import { motionAllowed, onMotionChange, select } from '../../../scripts/motion';

export function initOpening(): void {
  const section = select('[data-mt-open]', HTMLElement);
  if (!section) return;
  const root = document.documentElement;
  let queued = false;

  const update = (): void => {
    queued = false;
    if (!root.classList.contains('mt-pin')) return;
    const rect = section.getBoundingClientRect();
    const travel = rect.height - innerHeight;
    const progress = travel > 0 ? Math.min(1, Math.max(0, -rect.top / travel)) : 0;
    section.style.setProperty('--p', progress.toFixed(4));
  };
  const queue = (): void => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };

  // Pinning is itself motion: with reduced motion the scene is one still picture at sunrise.
  const apply = (): void => {
    const pin = motionAllowed();
    root.classList.toggle('mt-pin', pin);
    if (!pin) section.style.removeProperty('--p');
    queue();
  };

  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  onMotionChange(apply);
  apply();
}
