import { select } from './motion';

// Moves the scroll cat (tablets and up): its place on the rope follows how far the page has
// scrolled, it swings only while the page is moving, and at the very end it lands on the bottom.
// The animations themselves are CSS, so paused or reduced motion leaves a still cat that only
// changes place.
const cat = select('[data-scroll-cat]', HTMLElement);
const wideLayout = matchMedia('(min-width: 651px)');

if (cat) {
  let frame = 0;
  let stopTimer = 0;

  const place = () => {
    const range = document.documentElement.scrollHeight - innerHeight;
    const progress = range > 0 ? Math.min(1, scrollY / range) : 0;
    cat.style.setProperty('--progress', String(progress));
    cat.classList.toggle('is-landed', progress > 0.985);
  };

  const onScroll = () => {
    if (!wideLayout.matches) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      place();
      cat.classList.add('is-running');
      clearTimeout(stopTimer);
      stopTimer = window.setTimeout(() => cat.classList.remove('is-running'), 160);
    });
  };

  place();
  cat.classList.add('is-ready');
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', place);
}
