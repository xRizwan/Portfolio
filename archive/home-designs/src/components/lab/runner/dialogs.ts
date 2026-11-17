// The two pop-ups: a certificate viewer and the notes for a role. Both are enhancements over
// plain markup: without this script a certificate is a link to its full image and the notes are
// an ordinary <details>.
import { select, selectAll } from '../../../scripts/motion';

function closeOnBackdrop(dialog: HTMLDialogElement): void {
  dialog.addEventListener('click', (event) => {
    // A click on the dialog element itself (not its contents) is a click on the backdrop.
    if (event.target === dialog) dialog.close();
  });
  for (const button of selectAll('[data-close]', HTMLButtonElement, dialog)) {
    button.addEventListener('click', () => dialog.close());
  }
}

const viewer = select('#rn-viewer', HTMLDialogElement);
const picture = viewer ? select('img', HTMLImageElement, viewer) : null;
const caption = viewer ? select('figcaption strong', HTMLElement, viewer) : null;
const issuer = viewer ? select('figcaption span', HTMLElement, viewer) : null;
const openers = selectAll('.rn-cert__open', HTMLAnchorElement);

if (viewer && picture && caption && issuer && openers.length > 0) {
  let shown = 0;
  const show = (index: number): void => {
    // Wraps round at both ends.
    shown = (index + openers.length) % openers.length;
    const opener = openers[shown];
    if (!opener) return;
    picture.src = opener.href;
    picture.alt = opener.dataset.alt ?? '';
    caption.textContent = opener.dataset.title ?? '';
    issuer.textContent = opener.dataset.issuer ?? '';
  };

  for (const [index, opener] of openers.entries()) {
    opener.addEventListener('click', (event) => {
      event.preventDefault();
      show(index);
      viewer.showModal();
    });
  }
  for (const button of selectAll('[data-step]', HTMLButtonElement, viewer)) {
    button.addEventListener('click', () => show(shown + Number(button.dataset.step)));
  }
  viewer.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') show(shown - 1);
    if (event.key === 'ArrowRight') show(shown + 1);
  });
  closeOnBackdrop(viewer);
}

const notes = select('#rn-notes', HTMLDialogElement);
const notesBody = notes ? select('.rn-dialog__body', HTMLElement, notes) : null;

if (notes && notesBody) {
  for (const more of selectAll('.rn-more', HTMLDetailsElement)) {
    const summary = select('summary', HTMLElement, more);
    const body = select('.rn-more__body', HTMLElement, more);
    if (!summary || !body) continue;
    summary.addEventListener('click', (event) => {
      // While the level is being played a card has no room to grow, so the notes open in a
      // pop-up. On the plain page the <details> simply opens in place.
      if (!document.documentElement.classList.contains('rn-play')) return;
      event.preventDefault();
      notesBody.replaceChildren(body.cloneNode(true));
      notes.showModal();
    });
  }
  closeOnBackdrop(notes);
}
