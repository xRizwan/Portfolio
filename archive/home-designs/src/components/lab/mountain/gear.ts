// The gear flat-lay: picking an item up lifts it off the tarp and shows its packing list.
// Without scripts every list is visible and the items are plain links to them.
import { motionAllowed, select, selectAll } from '../../../scripts/motion';

export function initGear(): void {
  const section = select('[data-mt-gear]', HTMLElement);
  if (!section) return;
  const kits = selectAll('[data-mt-kit]', HTMLAnchorElement, section);
  const packs = selectAll('[data-mt-pack]', HTMLElement, section);
  const card = select('.mt-pack-card', HTMLElement, section);
  if (kits.length === 0 || packs.length === 0) return;

  const show = (id: string, fresh: boolean): void => {
    for (const kit of kits) {
      if (kit.dataset.mtKit === id) kit.setAttribute('aria-current', 'true');
      else kit.removeAttribute('aria-current');
    }
    for (const pack of packs) {
      const match = pack.dataset.mtPack === id;
      pack.hidden = !match;
      pack.classList.remove('is-fresh');
      if (match && fresh) {
        // Restart the pencil ticks: drop the class, force a style pass, add it back.
        void pack.offsetWidth;
        pack.classList.add('is-fresh');
      }
    }
  };

  for (const kit of kits) {
    kit.addEventListener('click', (event) => {
      const id = kit.dataset.mtKit;
      if (!id) return;
      event.preventDefault();
      show(id, true);
      // On one-column layouts the list sits under the tarp; bring it into view.
      if (card) {
        const rect = card.getBoundingClientRect();
        if (rect.top > innerHeight * 0.85 || rect.bottom < 80) {
          card.scrollIntoView({ behavior: motionAllowed() ? 'smooth' : 'auto', block: 'nearest' });
        }
      }
    });
  }

  const first = kits[0]?.dataset.mtKit;
  if (first) show(first, false);
}
