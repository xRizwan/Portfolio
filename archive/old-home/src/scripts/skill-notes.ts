import { select, selectAll } from './motion';

// Desktop notes can be dragged (pointer or arrow keys), spread into a readable grid, or reset.
// Without JavaScript the notes are an ordinary grid.
const mobile = matchMedia('(max-width: 900px)');
const reset = select('.reset-notes', HTMLButtonElement);
const spread = select('.spread-notes', HTMLButtonElement);
const notes = selectAll('.skill-group', HTMLElement);
const restores: (() => void)[] = [];
document.body.classList.add('notes-ready');

const canDrag = (): boolean => !mobile.matches && !document.body.classList.contains('notes-spread');

for (const note of notes) {
  const handle = select('.note-handle', HTMLButtonElement, note);
  if (!handle) continue;
  let x = 0;
  let y = 0;
  let drag: { id: number; x: number; y: number } | null = null;

  const place = (nextX: number, nextY: number): void => {
    const bounds = note.getBoundingClientRect();
    x = Math.max(20 - bounds.left + x, Math.min(innerWidth - 20 - bounds.right + x, nextX));
    y = Math.max(-60, Math.min(95, nextY));
    note.style.setProperty('--note-x', `${x}px`);
    note.style.setProperty('--note-y', `${y}px`);
  };
  const release = (): void => {
    drag = null;
    note.classList.remove('is-dragging');
  };

  handle.addEventListener('pointerdown', (event) => {
    if (!canDrag() || event.button !== 0) return;
    event.preventDefault();
    handle.focus({ preventScroll: true });
    drag = { id: event.pointerId, x: event.clientX - x, y: event.clientY - y };
    note.classList.add('is-dragging');
    handle.setPointerCapture(event.pointerId);
  });
  handle.addEventListener('pointermove', (event) => {
    if (drag && drag.id === event.pointerId) place(event.clientX - drag.x, event.clientY - drag.y);
  });
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) {
    handle.addEventListener(name, release);
  }
  const moves: Record<string, [number, number]> = {
    ArrowLeft: [-16, 0],
    ArrowRight: [16, 0],
    ArrowUp: [0, -16],
    ArrowDown: [0, 16],
  };
  handle.addEventListener('keydown', (event) => {
    const move = moves[event.key];
    if (!canDrag() || !move) return;
    event.preventDefault();
    place(x + move[0], y + move[1]);
  });
  restores.push(() => {
    x = 0;
    y = 0;
    release();
    note.style.removeProperty('--note-x');
    note.style.removeProperty('--note-y');
  });
}

const resetAll = (): void => {
  for (const restore of restores) restore();
};
const setHandles = (hidden: boolean): void => {
  for (const note of notes) {
    const handle = select('.note-handle', HTMLButtonElement, note);
    if (handle) handle.hidden = hidden;
  }
};

reset?.addEventListener('click', resetAll);
spread?.addEventListener('click', () => {
  resetAll();
  const opened = document.body.classList.toggle('notes-spread');
  spread.textContent = opened ? 'Stack notes' : 'Spread notes';
  spread.setAttribute('aria-pressed', String(opened));
  setHandles(opened);
  if (reset) reset.hidden = opened;
});

const adapt = (): void => {
  resetAll();
  const expanded = document.body.classList.contains('notes-spread');
  if (reset) reset.hidden = mobile.matches || expanded;
  if (spread) spread.hidden = mobile.matches;
  setHandles(mobile.matches || expanded);
};
mobile.addEventListener('change', adapt);
adapt();
