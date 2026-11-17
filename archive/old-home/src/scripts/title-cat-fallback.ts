import { motionAllowed, onMotionChange, select } from './motion';

// Flat SVG cat that paces along RIZZY when the 3D title cats are unavailable. It walks, pauses,
// turns, and hops with a "mrrp" when tapped. When the 3D cats are ready, CSS hides it and this
// script does nothing.
const lane = select('.title-cat', HTMLElement);
const walker = lane ? select('.title-cat-walk', HTMLElement, lane) : null;

if (lane && walker && !document.body.classList.contains('title-cats-ready')) {
  let x = 0;
  let target = 0;
  let direction = 1;
  let pauseUntil = 0;
  let frame = 0;
  let last = 0;
  let visible = true;
  const range = (): number => Math.max(0, lane.clientWidth - walker.offsetWidth);
  const place = (): void => {
    walker.style.transform = `translateX(${x}px)`;
    walker.classList.toggle('facing-left', direction < 0);
  };
  const chooseTarget = (): void => {
    const max = range();
    // Mostly long walks to either end, sometimes a short stroll.
    target =
      Math.random() < 0.65
        ? x < max / 2
          ? max * (0.85 + Math.random() * 0.15)
          : max * Math.random() * 0.15
        : Math.random() * max;
    direction = target >= x ? 1 : -1;
  };
  const step = (timestamp: number): void => {
    frame = 0;
    if (!motionAllowed() || !visible || document.hidden) return;
    const delta = Math.min(0.05, (timestamp - last) / 1000 || 0);
    last = timestamp;
    if (timestamp < pauseUntil) {
      walker.classList.remove('is-walking');
    } else {
      walker.classList.add('is-walking');
      const speed = Math.max(40, walker.offsetWidth * 0.75);
      const distance = target - x;
      if (Math.abs(distance) <= speed * delta) {
        x = target;
        pauseUntil = timestamp + 900 + Math.random() * 2200;
        walker.classList.remove('is-walking');
        chooseTarget();
      } else {
        x += Math.sign(distance) * speed * delta;
      }
    }
    place();
    frame = requestAnimationFrame(step);
  };
  const sync = (): void => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    x = Math.min(x, range());
    if (!motionAllowed()) {
      walker.classList.remove('is-walking');
      x = range() * 0.62;
      direction = -1;
      place();
      return;
    }
    last = performance.now();
    if (visible && !document.hidden) frame = requestAnimationFrame(step);
  };
  walker.addEventListener('click', () => {
    walker.classList.remove('is-hopping', 'says-hi');
    void walker.offsetWidth;
    walker.classList.add('is-hopping', 'says-hi');
    pauseUntil = performance.now() + 1600;
  });
  walker.addEventListener('animationend', (event) => {
    if (event.animationName === 'cute-hop') walker.classList.remove('is-hopping');
    if (event.animationName === 'cute-bubble') walker.classList.remove('says-hi');
  });
  new ResizeObserver(sync).observe(lane);
  new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? true;
    sync();
  }).observe(lane);
  document.addEventListener('visibilitychange', sync);
  onMotionChange(sync);
  x = range() * 0.1;
  chooseTarget();
  place();
  sync();
}
