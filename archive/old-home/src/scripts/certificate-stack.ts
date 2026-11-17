import { finePointer, motionAllowed, select } from './motion';

// On wide screens the stack becomes a row wider than the view, scrolled so the centre certificate
// sits in the middle. Hovering then only spreads the fan in place (CSS); nothing jumps sideways,
// and the certificates beyond the fan can be scrolled to. Leaving the row eases it back to the
// centre. Without JavaScript the stack keeps the plain five-certificate fan.
const stack = select('[data-cert-stack]', HTMLElement);
const wideLayout = matchMedia('(min-width: 651px)');

/** Scroll position that puts the centre certificate (fan position 0) in the middle of the view. */
function centreScroll(element: HTMLElement): number {
  const style = getComputedStyle(element);
  const size = (name: string) => parseFloat(style.getPropertyValue(name)) || 0;
  const span = Number(element.dataset.slotSpan ?? 0);
  const index = Number(element.dataset.centreIndex ?? 0);
  const rowStart = (element.scrollWidth - span * size('--gap') - size('--card')) / 2;
  return rowStart + index * size('--gap') + size('--card') / 2 - element.clientWidth / 2;
}

if (stack) {
  const recentre = (smooth: boolean) => {
    if (!stack.classList.contains('has-row')) return;
    const left = centreScroll(stack);
    stack.scrollTo({ left, behavior: smooth && motionAllowed() ? 'smooth' : 'instant' });
  };
  const applyLayout = () => {
    stack.classList.toggle('has-row', wideLayout.matches);
    if (!wideLayout.matches) stack.scrollLeft = 0;
    recentre(false);
  };

  applyLayout();
  wideLayout.addEventListener('change', applyLayout);
  addEventListener('resize', () => {
    if (!stack.matches(':hover, :focus-within')) recentre(false);
  });
  stack.addEventListener('pointerleave', () => {
    if (!stack.contains(document.activeElement)) recentre(true);
  });
  stack.addEventListener('focusout', (event) => {
    const next = event.relatedTarget;
    if (!(next instanceof Node && stack.contains(next)) && !stack.matches(':hover')) {
      recentre(true);
    }
  });

  stack.addEventListener(
    'wheel',
    (event) => {
      if (!finePointer.matches || !stack.classList.contains('has-row')) return;
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const maxScroll = stack.scrollWidth - stack.clientWidth;
      const atStart = stack.scrollLeft <= 0 && event.deltaY < 0;
      const atEnd = stack.scrollLeft >= maxScroll - 1 && event.deltaY > 0;
      if (maxScroll <= 0 || atStart || atEnd) return;
      event.preventDefault();
      stack.scrollLeft += event.deltaY;
    },
    { passive: false },
  );
}
