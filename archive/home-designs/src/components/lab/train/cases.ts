// Things that open: the luggage on the rack and the covered dishes in the dining car. Each is a
// container marked data-tr-auto with a button inside. They open by themselves the first time
// they reach the middle of the screen, and the button opens and closes them after that.
import { select, selectAll } from '../../../scripts/motion';
import { pinned } from './frame';

interface Opener {
  box: HTMLElement;
  button: HTMLButtonElement;
  seen: boolean;
}

function setOpen(opener: Opener, open: boolean): void {
  opener.box.classList.toggle('is-open', open);
  opener.button.setAttribute('aria-expanded', String(open));
  const card = select('.tr-dish-card', HTMLElement, opener.box);
  if (card) {
    // A covered dish must not be reachable by keyboard or screen reader.
    card.inert = !open;
    opener.box.style.setProperty('--tr-lift', `${-(card.offsetHeight + 4)}px`);
  }
}

/** Sets the openers up and returns a function that opens any now near the middle of the view. */
export function initCases(): (viewWidth: number) => void {
  const openers: Opener[] = [];
  for (const box of selectAll('[data-tr-auto]', HTMLElement)) {
    const button = select('[data-tr-toggle]', HTMLButtonElement, box);
    if (!button) continue;
    const opener: Opener = { box, button, seen: !pinned() };
    openers.push(opener);
    // Travelling sideways, everything starts shut and opens as it arrives. Stacked, it stays open.
    setOpen(opener, opener.seen);
    button.addEventListener('click', () => {
      opener.seen = true;
      setOpen(opener, !box.classList.contains('is-open'));
    });
  }

  return (viewWidth) => {
    for (const opener of openers) {
      if (opener.seen) continue;
      const rect = opener.box.getBoundingClientRect();
      const middle = rect.left + Math.min(rect.width, viewWidth) / 2;
      if (middle > viewWidth * 0.1 && middle < viewWidth * 0.8) {
        opener.seen = true;
        setOpen(opener, true);
      }
    }
  };
}
