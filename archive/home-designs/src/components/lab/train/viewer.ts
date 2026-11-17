// The certificate viewer: picking a frame off the corridor wall opens it large in a dialog,
// with previous and next. Without this script each frame is a plain link to the image.
import { select, selectAll } from '../../../scripts/motion';

export function initViewer(): void {
  const dialog = select('[data-tr-viewer]', HTMLDialogElement);
  const image = select('[data-tr-viewer-img]', HTMLImageElement);
  const title = select('[data-tr-viewer-title]', HTMLElement);
  const issuer = select('[data-tr-viewer-issuer]', HTMLElement);
  const frames = selectAll('[data-tr-cert]', HTMLAnchorElement);
  if (!dialog || !image || !title || !issuer || frames.length === 0) return;
  if (typeof dialog.showModal !== 'function') return;

  let current = 0;
  const show = (index: number): void => {
    current = (index + frames.length) % frames.length;
    const frame = frames[current];
    if (!frame) return;
    image.src = frame.href;
    image.alt = frame.dataset.alt ?? '';
    title.textContent = frame.dataset.title ?? '';
    issuer.textContent = frame.dataset.issuer ?? '';
  };

  frames.forEach((frame, index) => {
    frame.addEventListener('click', (event) => {
      // Leave modified clicks alone so the image can still be opened in a new tab.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      event.preventDefault();
      show(index);
      dialog.showModal();
    });
  });
  select('[data-tr-viewer-prev]', HTMLButtonElement, dialog)?.addEventListener('click', () =>
    show(current - 1),
  );
  select('[data-tr-viewer-next]', HTMLButtonElement, dialog)?.addEventListener('click', () =>
    show(current + 1),
  );
  select('[data-tr-viewer-close]', HTMLButtonElement, dialog)?.addEventListener('click', () =>
    dialog.close(),
  );
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') show(current - 1);
    if (event.key === 'ArrowRight') show(current + 1);
  });
  // A click on the dark surround closes it.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  // Focus goes back to the frame that is showing, which may not be the one first picked.
  dialog.addEventListener('close', () => frames[current]?.focus());
}
