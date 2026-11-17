// Interactions inside the sections: things inking in as they scroll into view, the pack's
// items, the dice, the trophy dialog and its hand-held light, and the raven leaning to the cursor.
import { finePointer, motionAllowed, select, selectAll } from '../../../scripts/motion';

/** Adds `is-in` to `[data-reveal]` elements when they enter the screen. */
function reveals(): void {
  const targets = selectAll('[data-reveal]', HTMLElement);
  if (!('IntersectionObserver' in window)) {
    for (const target of targets) target.classList.add('is-in');
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
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  for (const target of targets) observer.observe(target);
}

/** The pack: the item links become tabs, and only the chosen group's contents are laid out. */
function pack(): void {
  const list = select('[data-pack-slots]', HTMLElement);
  const slots = selectAll('[data-slot]', HTMLAnchorElement);
  const pouches = selectAll('[data-pouch]', HTMLElement);
  if (!list || slots.length === 0 || pouches.length === 0) return;

  list.setAttribute('role', 'tablist');
  for (const item of selectAll('li', HTMLLIElement, list)) item.setAttribute('role', 'none');
  for (const pouch of pouches) {
    pouch.setAttribute('role', 'tabpanel');
    pouch.tabIndex = 0;
  }

  const choose = (id: string | undefined, focus = false): void => {
    for (const slot of slots) {
      const selected = slot.dataset.slot === id;
      slot.setAttribute('aria-selected', String(selected));
      slot.tabIndex = selected ? 0 : -1;
      if (selected && focus) slot.focus();
    }
    for (const pouch of pouches) {
      const selected = pouch.dataset.pouch === id;
      pouch.hidden = !selected;
      pouch.classList.remove('is-laying');
      if (selected) {
        // Reading the width restarts the laying-out animation for a group chosen again.
        void pouch.offsetWidth;
        pouch.classList.add('is-laying');
      }
    }
  };

  slots.forEach((slot, index) => {
    slot.setAttribute('role', 'tab');
    slot.setAttribute('aria-controls', `pack-${slot.dataset.slot ?? ''}`);
    slot.addEventListener('click', (event) => {
      event.preventDefault();
      choose(slot.dataset.slot);
    });
    slot.addEventListener('keydown', (event) => {
      const step =
        event.key === 'ArrowRight' || event.key === 'ArrowDown'
          ? 1
          : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
            ? -1
            : 0;
      if (event.key === ' ') {
        event.preventDefault();
        choose(slot.dataset.slot);
      }
      if (step === 0) return;
      event.preventDefault();
      const next = slots[(index + step + slots.length) % slots.length];
      choose(next?.dataset.slot, true);
    });
  });
  choose(slots[0]?.dataset.slot);
}

/** The dice: tumble, then mark one of the traits. */
function dice(): void {
  const button = select('[data-roll]', HTMLButtonElement);
  const note = select('[data-roll-note]', HTMLElement);
  const traits = selectAll('[data-trait]', HTMLElement);
  if (!button || traits.length === 0) return;
  let last = -1;
  let timer = 0;
  button.addEventListener('click', () => {
    // Never land on the same trait twice in a row, so a roll always visibly does something.
    let pick = Math.floor(Math.random() * traits.length);
    if (pick === last) pick = (pick + 1) % traits.length;
    last = pick;
    for (const trait of traits) trait.classList.remove('is-rolled');
    button.classList.remove('is-rolling');
    void button.offsetWidth;
    button.classList.add('is-rolling');
    clearTimeout(timer);
    timer = window.setTimeout(
      () => {
        const trait = traits[pick];
        if (!trait) return;
        trait.classList.add('is-rolled');
        const title = trait.querySelector('h4')?.textContent ?? '';
        if (note) note.textContent = `The dice say: ${title}.`;
      },
      motionAllowed() ? 620 : 0,
    );
  });
}

/** The trophy hall: pick a trophy up to see it full size; a light follows the mouse. */
function hall(): void {
  const dialog = select('[data-inspect]', HTMLDialogElement);
  const image = select('[data-inspect-img]', HTMLImageElement);
  const title = select('[data-inspect-title]', HTMLElement);
  const issuer = select('[data-inspect-issuer]', HTMLElement);
  const trophies = selectAll('[data-trophy]', HTMLAnchorElement);
  if (dialog && image && typeof dialog.showModal === 'function') {
    let current = 0;
    const show = (index: number): void => {
      current = (index + trophies.length) % trophies.length;
      const trophy = trophies[current];
      if (!trophy) return;
      image.src = trophy.href;
      image.alt = trophy.dataset.alt ?? '';
      if (title) title.textContent = trophy.dataset.title ?? '';
      if (issuer) issuer.textContent = trophy.dataset.issuer ?? '';
    };
    trophies.forEach((trophy, index) => {
      trophy.addEventListener('click', (event) => {
        // Leave modified clicks alone so the image can still be opened in a new tab.
        if (event.metaKey || event.ctrlKey || event.shiftKey) return;
        event.preventDefault();
        show(index);
        dialog.showModal();
      });
    });
    select('[data-inspect-prev]', HTMLButtonElement)?.addEventListener('click', () =>
      show(current - 1),
    );
    select('[data-inspect-next]', HTMLButtonElement)?.addEventListener('click', () =>
      show(current + 1),
    );
    select('[data-inspect-close]', HTMLButtonElement)?.addEventListener('click', () =>
      dialog.close(),
    );
    dialog.addEventListener('click', (event) => {
      // A click on the dialog element itself is a click on the backdrop.
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') show(current - 1);
      if (event.key === 'ArrowRight') show(current + 1);
    });
  }

  const grid = select('[data-hall]', HTMLElement);
  const light = select('.qg-hall__light', HTMLElement);
  if (grid && light) {
    grid.addEventListener('pointermove', (event) => {
      if (!finePointer.matches || event.pointerType !== 'mouse') return;
      const rect = light.getBoundingClientRect();
      light.style.setProperty('--lx', `${(event.clientX - rect.left).toFixed(0)}px`);
      light.style.setProperty('--ly', `${(event.clientY - rect.top).toFixed(0)}px`);
      grid.classList.add('is-lit');
    });
    grid.addEventListener('pointerleave', () => grid.classList.remove('is-lit'));
    // Keyboard users get the whole wall lit.
    grid.addEventListener('focusin', () => grid.classList.remove('is-lit'));
  }
}

/** The raven drifts a little towards the cursor while it is over the contact section. */
function raven(): void {
  const bird = select('[data-raven]', HTMLElement);
  const section = bird?.closest('section');
  if (!bird || !section) return;
  section.addEventListener('pointermove', (event) => {
    if (!finePointer.matches || !motionAllowed()) return;
    const rect = bird.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    bird.style.setProperty('--rx', `${Math.max(-46, Math.min(46, dx * 0.07)).toFixed(1)}px`);
    bird.style.setProperty('--ry', `${Math.max(-30, Math.min(30, dy * 0.07)).toFixed(1)}px`);
  });
  section.addEventListener('pointerleave', () => {
    bird.style.removeProperty('--rx');
    bird.style.removeProperty('--ry');
  });
}

export function startUi(): void {
  reveals();
  pack();
  dice();
  hall();
  raven();
}
