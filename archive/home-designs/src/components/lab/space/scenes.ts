// Smaller behaviours shared by the sections: things that rise into view, artwork that drifts with
// the scroll, mission patches that tilt toward the pointer, and the certificate dialog.
import { finePointer, select, selectAll } from '../../../scripts/motion';
import { onFrame } from './frame';

/** Adds `is-in` to every `[data-rise]` element the first time it scrolls into view. */
export function initRise(): void {
  const pieces = selectAll('[data-rise]', HTMLElement);
  if (!('IntersectionObserver' in window)) {
    for (const piece of pieces) piece.classList.add('is-in');
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
  for (const piece of pieces) observer.observe(piece);
}

/**
 * Parallax for decorative artwork: `data-drift="n"` moves the element n pixels over one screen of
 * scrolling (negative drifts the other way). It uses the `translate` property, so it never fights
 * an element's own transform animation.
 */
export function initDrift(): void {
  const pieces = selectAll('[data-drift]', HTMLElement).map((element) => ({
    element,
    amount: Number(element.dataset.drift),
    near: false,
  }));
  if (pieces.length === 0 || !('IntersectionObserver' in window)) return;
  const lookup = new Map<Element, (typeof pieces)[number]>();
  for (const piece of pieces) lookup.set(piece.element, piece);
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const piece = lookup.get(entry.target);
        if (piece) piece.near = entry.isIntersecting;
      }
    },
    { rootMargin: '30% 0px 30% 0px' },
  );
  for (const piece of pieces) observer.observe(piece.element);

  onFrame(
    (state) => {
      for (const piece of pieces) {
        if (!piece.near) continue;
        const box = piece.element.getBoundingClientRect();
        // The element's own offset is taken back out, so the measure does not chase itself.
        const shift = Number(piece.element.dataset.shift ?? 0);
        const middle = box.top - shift + box.height / 2;
        const next = ((middle - state.height / 2) / state.height) * piece.amount;
        piece.element.dataset.shift = next.toFixed(1);
        piece.element.style.translate = `0 ${next.toFixed(1)}px`;
      }
    },
    () => {
      for (const piece of pieces) {
        piece.element.style.translate = '';
        delete piece.element.dataset.shift;
      }
    },
  );
}

/** Mission patches lean toward the pointer while it is over their card. */
export function initTilt(): void {
  if (!finePointer.matches) return;
  for (const card of selectAll('[data-sp-tilt]', HTMLElement)) {
    card.addEventListener('pointermove', (event) => {
      const box = card.getBoundingClientRect();
      card.style.setProperty(
        '--tilt-x',
        (((event.clientX - box.left) / box.width) * 2 - 1).toFixed(2),
      );
      card.style.setProperty(
        '--tilt-y',
        (((event.clientY - box.top) / box.height) * 2 - 1).toFixed(2),
      );
    });
    card.addEventListener('pointerleave', () => {
      card.style.removeProperty('--tilt-x');
      card.style.removeProperty('--tilt-y');
    });
  }
}

/** Certificates: a frame opens the full-size document in a dialog, with previous and next. */
export function initCertificates(): void {
  const dialog = select('[data-sp-cert-dialog]', HTMLDialogElement);
  const frames = selectAll('[data-sp-cert]', HTMLAnchorElement);
  if (!dialog || frames.length === 0 || typeof dialog.showModal !== 'function') return;
  const image = select('[data-cert-image]', HTMLImageElement, dialog);
  const title = select('[data-cert-title]', HTMLElement, dialog);
  const issuer = select('[data-cert-issuer]', HTMLElement, dialog);
  if (!image || !title || !issuer) return;
  let current = 0;

  const show = (index: number): void => {
    current = ((index % frames.length) + frames.length) % frames.length;
    const frame = frames[current];
    if (!frame) return;
    image.src = frame.href;
    image.alt = frame.dataset.alt ?? '';
    image.width = Number(frame.dataset.width) || 1600;
    image.height = Number(frame.dataset.height) || 1200;
    title.textContent = frame.dataset.title ?? '';
    issuer.textContent = frame.dataset.issuer ?? '';
  };

  frames.forEach((frame, index) => {
    frame.addEventListener('click', (event) => {
      // Leave modified clicks alone so the image can still be opened in a new tab.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      show(index);
      dialog.showModal();
    });
  });
  select('[data-cert-prev]', HTMLButtonElement, dialog)?.addEventListener('click', () =>
    show(current - 1),
  );
  select('[data-cert-next]', HTMLButtonElement, dialog)?.addEventListener('click', () =>
    show(current + 1),
  );
  select('[data-cert-close]', HTMLButtonElement, dialog)?.addEventListener('click', () =>
    dialog.close(),
  );
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') show(current - 1);
    if (event.key === 'ArrowRight') show(current + 1);
  });
  // A click on the backdrop (the dialog itself, outside the sheet) closes it.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  // Put the focus back on the frame that was open, which may not be the one that was clicked.
  dialog.addEventListener('close', () => frames[current]?.focus());
}
