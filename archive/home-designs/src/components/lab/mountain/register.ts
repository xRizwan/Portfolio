// The summit register: opens the chosen stamp large in a dialog, with previous and next.
import { select, selectAll } from '../../../scripts/motion';

export function initRegister(): void {
  const dialog = select('[data-mt-viewer]', HTMLDialogElement);
  const image = select('[data-mt-viewer-img]', HTMLImageElement);
  const title = select('[data-mt-viewer-title]', HTMLElement);
  const issuer = select('[data-mt-viewer-issuer]', HTMLElement);
  const stamps = selectAll('[data-mt-stamp]', HTMLAnchorElement);
  if (!dialog || !image || !title || !issuer || stamps.length === 0) return;
  if (typeof dialog.showModal !== 'function') return;

  const closeButton = select('[data-mt-viewer-close]', HTMLButtonElement, dialog);
  let current = 0;

  const show = (index: number): void => {
    current = (index + stamps.length) % stamps.length;
    const stamp = stamps[current];
    if (!stamp) return;
    image.src = stamp.href;
    image.alt = stamp.dataset.alt ?? '';
    title.textContent = stamp.dataset.title ?? '';
    issuer.textContent = stamp.dataset.issuer ?? '';
  };

  stamps.forEach((stamp, index) => {
    stamp.addEventListener('click', (event) => {
      // Modified clicks still open the image in a new tab as usual.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      event.preventDefault();
      show(index);
      dialog.showModal();
      closeButton?.focus();
    });
  });

  select('[data-mt-viewer-prev]', HTMLButtonElement, dialog)?.addEventListener('click', () =>
    show(current - 1),
  );
  select('[data-mt-viewer-next]', HTMLButtonElement, dialog)?.addEventListener('click', () =>
    show(current + 1),
  );
  closeButton?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') show(current - 1);
    if (event.key === 'ArrowRight') show(current + 1);
  });
  // A click on the dimmed backdrop lands on the dialog element itself.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => stamps[current]?.focus());
}
