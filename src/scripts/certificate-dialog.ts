import { motionAllowed, select, selectAll } from './motion';

// Certificate links open a carousel of every credential, starting at the one clicked. Slides are
// a scroll-snapped row, so touch swiping works natively; buttons and arrow keys step through it.
// On phones "See all certificates" opens the carousel instead of expanding the long list.
// Without JavaScript the links open the image and the list expands as usual.
const dialog = select('.certificate-dialog', HTMLDialogElement);
const track = dialog ? select('[data-carousel-track]', HTMLElement, dialog) : null;

if (dialog && track && typeof dialog.showModal === 'function') {
  const slides = selectAll('.carousel-slide', HTMLElement, track);
  const count = select('[data-carousel-count]', HTMLElement, dialog);
  const previous = select('[data-carousel-prev]', HTMLButtonElement, dialog);
  const next = select('[data-carousel-next]', HTMLButtonElement, dialog);
  const phoneLayout = matchMedia('(max-width: 650px)');
  let current = 0;
  let openedFrom: HTMLElement | null = null;

  const show = (index: number) => {
    current = Math.max(0, Math.min(slides.length - 1, index));
    // Slide images are lazy; fetch the visible one and its neighbours straight away.
    for (const slide of slides.slice(Math.max(0, current - 1), current + 2)) {
      slide.querySelector('img')?.setAttribute('loading', 'eager');
    }
    if (count) count.textContent = `${current + 1} / ${slides.length}`;
    if (previous) previous.disabled = current === 0;
    if (next) next.disabled = current === slides.length - 1;
  };

  const goTo = (index: number, smooth = true) => {
    const target = Math.max(0, Math.min(slides.length - 1, index));
    track.scrollTo({
      left: target * track.clientWidth,
      behavior: smooth && motionAllowed() ? 'smooth' : 'instant',
    });
    show(target);
  };

  const open = (index: number, opener: HTMLElement) => {
    openedFrom = opener;
    dialog.showModal();
    goTo(index, false);
  };

  for (const link of selectAll('a[data-slide]', HTMLAnchorElement)) {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      open(Number(link.dataset.slide), link);
    });
  }

  for (const summary of selectAll('[data-carousel-open]', HTMLElement)) {
    summary.addEventListener('click', (event) => {
      if (!phoneLayout.matches) return;
      event.preventDefault();
      open(0, summary);
    });
  }

  // Keep the counter and buttons in step with swiping.
  let frame = 0;
  track.addEventListener(
    'scroll',
    () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (track.clientWidth > 0) show(Math.round(track.scrollLeft / track.clientWidth));
      });
    },
    { passive: true },
  );

  previous?.addEventListener('click', () => goTo(current - 1));
  next?.addEventListener('click', () => goTo(current + 1));
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') goTo(current - 1);
    else if (event.key === 'ArrowRight') goTo(current + 1);
    else return;
    event.preventDefault();
  });
  addEventListener('resize', () => {
    if (dialog.open) goTo(current, false);
  });

  select('[data-close]', HTMLButtonElement, dialog)?.addEventListener('click', () =>
    dialog.close(),
  );
  // There is no panel, so a click anywhere outside the image itself closes the viewer.
  dialog.addEventListener('click', (event) => {
    const target = event.target;
    if (target === dialog || (target instanceof HTMLElement && target.matches('.carousel-slide'))) {
      dialog.close();
    }
  });
  dialog.addEventListener('close', () => openedFrom?.focus());
}
