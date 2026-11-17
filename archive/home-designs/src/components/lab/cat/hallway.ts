// Experience hallway: pins the section and turns vertical scrolling into a walk past the frames.
import { motionAllowed, onMotionChange, select, selectAll } from '../../../scripts/motion';
import { clamp, onFrame } from './ticker';

export function initHallway(): void {
  const hall = select('[data-cat-hall]', HTMLElement);
  const stage = select('[data-cat-hall-stage]', HTMLElement);
  const track = select('[data-cat-hall-track]', HTMLElement);
  const walker = select('[data-cat-hall-walker]', HTMLElement);
  const ball = select('[data-cat-hall-ball]', HTMLElement);
  if (!hall || !stage || !track || !walker || !ball) return;
  const roles = selectAll('[data-cat-role]', HTMLElement, track);
  const details = selectAll('details', HTMLDetailsElement, track);

  let distance = 0;
  let lastOffset = -1;
  let walked = 0;
  let idleFor = 0;

  const layout = (): void => {
    const pinned = motionAllowed();
    hall.classList.toggle('is-pinned', pinned);
    if (!pinned) {
      hall.style.removeProperty('height');
      track.style.removeProperty('transform');
      roles.forEach((role) => role.style.removeProperty('--lit'));
      return;
    }
    distance = Math.max(0, track.scrollWidth - stage.clientWidth);
    // One pixel of scrolling moves the hallway one pixel sideways.
    hall.style.height = `${stage.clientHeight + distance}px`;
    lastOffset = -1;
  };

  layout();
  new ResizeObserver(layout).observe(stage);
  onMotionChange(layout);

  // Only one list of points open at a time, and Escape closes it.
  details.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (!item.open) return;
      details.forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
    item.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && item.open) {
        item.open = false;
        item.querySelector('summary')?.focus();
      }
    });
  });

  // Keyboard users reach the frames with Tab; bring the focused one into the pinned view.
  track.addEventListener('focusin', (event) => {
    if (!hall.classList.contains('is-pinned') || !(event.target instanceof HTMLElement)) return;
    const item = event.target.closest<HTMLElement>('[data-cat-role], .cat-hall-end');
    if (!item) return;
    const centre = item.offsetLeft + item.offsetWidth / 2 - stage.clientWidth / 2;
    const top = hall.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + clamp(centre, 0, distance), behavior: 'auto' });
    // Focusing can scroll the clipped stage itself; keep it at rest.
    stage.scrollLeft = 0;
  });

  onFrame(({ dt, viewW }) => {
    if (!hall.classList.contains('is-pinned')) return;
    const offset = clamp(-hall.getBoundingClientRect().top, 0, distance);
    if (offset === lastOffset) {
      idleFor += dt;
      if (idleFor > 260) walker.dataset.pose = 'sit';
      return;
    }
    const delta = lastOffset < 0 ? 0 : offset - lastOffset;
    lastOffset = offset;
    idleFor = 0;
    track.style.transform = `translateX(${(-offset).toFixed(1)}px)`;

    // Each frame brightens as it comes to the middle of the screen.
    for (const role of roles) {
      const centre = role.offsetLeft + role.offsetWidth / 2 - offset;
      const lit = 1 - clamp((Math.abs(centre - viewW / 2) - viewW * 0.12) / (viewW * 0.38));
      role.style.setProperty('--lit', lit.toFixed(3));
    }

    // The cat keeps pace with the scroll: steps follow distance, direction follows the scroll.
    if (delta !== 0) {
      walked += Math.abs(delta);
      const step = walker.offsetWidth * 0.3;
      walker.dataset.pose = Math.floor(walked / step) % 2 === 0 ? 'walk-a' : 'walk-b';
      walker.style.transform = `scaleX(${delta > 0 ? 1 : -1})`;
      ball.style.transform = `rotate(${((offset / (ball.offsetWidth / 2)) * 57.3).toFixed(0)}deg)`;
    }
  });
}
