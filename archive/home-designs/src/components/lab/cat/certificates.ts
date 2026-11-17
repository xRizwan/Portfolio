// Certificate wall: opens the chosen frame in a dialog, with previous/next, and asks the calico
// to come and sit on it.
import { select, selectAll } from '../../../scripts/motion';
import { setNapperPerch } from './residents';

export function initCertificates(): void {
  const dialog = select('[data-cat-lightbox]', HTMLDialogElement);
  const image = select('[data-cat-lightbox-img]', HTMLImageElement);
  const title = select('[data-cat-lightbox-title]', HTMLElement);
  const issuer = select('[data-cat-lightbox-issuer]', HTMLElement);
  const perch = select('[data-cat-lightbox-perch]', HTMLElement);
  const links = selectAll('[data-cat-cert]', HTMLAnchorElement);
  if (!dialog || !image || !title || !issuer || !perch || links.length === 0) return;
  if (typeof dialog.showModal !== 'function') return;

  const closeButton = select('[data-cat-lightbox-close]', HTMLButtonElement, dialog);
  let current = 0;

  const show = (index: number): void => {
    current = (index + links.length) % links.length;
    const link = links[current];
    if (!link) return;
    image.src = link.href;
    image.alt = link.dataset.alt ?? '';
    title.textContent = link.dataset.title ?? '';
    issuer.textContent = link.dataset.issuer ?? '';
  };

  links.forEach((link, index) => {
    link.addEventListener('click', (event) => {
      // Let modified clicks open the image in a new tab as usual.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      event.preventDefault();
      show(index);
      dialog.showModal();
      closeButton?.focus();
      setNapperPerch(perch);
    });
  });

  select('[data-cat-lightbox-prev]', HTMLButtonElement, dialog)?.addEventListener('click', () =>
    show(current - 1),
  );
  select('[data-cat-lightbox-next]', HTMLButtonElement, dialog)?.addEventListener('click', () =>
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
  dialog.addEventListener('close', () => {
    setNapperPerch(null);
    links[current]?.focus();
  });
}
