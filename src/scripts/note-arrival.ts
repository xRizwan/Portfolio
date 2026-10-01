import { motionAllowed, onMotionChange, selectAll } from './motion';

// The first time the skill notes scroll into view they fly in from the sides and slap onto
// the board one after another. Without JavaScript, or with reduced motion, they are simply there.
const notes = selectAll('.skill-group', HTMLElement);

if (notes.length && motionAllowed() && 'IntersectionObserver' in window) {
  document.body.classList.add('notes-pending');
  const center = innerWidth / 2;
  notes.forEach((note, index) => {
    const box = note.getBoundingClientRect();
    const side = box.left + box.width / 2 < center ? -1 : 1;
    const spin = (12 + Math.random() * 26) * (index % 2 ? 1 : -1);
    note.style.setProperty('--fly-x', `${side * (innerWidth * 0.45 + Math.random() * 260)}px`);
    note.style.setProperty('--fly-y', `${-180 - Math.random() * 320}px`);
    note.style.setProperty('--fly-r', `${spin}deg`);
  });

  const landed = new Set<HTMLElement>();
  const finish = (): void => {
    if (
      landed.size === notes.length &&
      notes.every((note) => note.classList.contains('has-landed'))
    ) {
      document.body.classList.remove('notes-pending');
    }
  };
  const land = (note: HTMLElement, delay: number): void => {
    if (landed.has(note)) return;
    landed.add(note);
    note.style.setProperty('--arrive-delay', `${delay}ms`);
    note.classList.add('is-arriving');
    note.addEventListener('animationend', (event) => {
      if (event.animationName !== 'note-arrive') return;
      note.classList.remove('is-arriving');
      note.classList.add('has-landed');
      finish();
    });
  };
  const observer = new IntersectionObserver(
    (entries) => {
      const arriving = entries
        .filter((entry) => entry.isIntersecting)
        .map((entry) => entry.target)
        .filter((target): target is HTMLElement => target instanceof HTMLElement)
        .sort((a, b) => notes.indexOf(a) - notes.indexOf(b));
      arriving.forEach((note, order) => {
        land(note, order * 110);
        observer.unobserve(note);
      });
    },
    { threshold: 0.2, rootMargin: '0px 0px -8% 0px' },
  );
  for (const note of notes) observer.observe(note);

  // If motion is paused part-way, show every note at rest immediately.
  onMotionChange(() => {
    if (motionAllowed()) return;
    observer.disconnect();
    for (const note of notes) {
      note.classList.remove('is-arriving');
      note.classList.add('has-landed');
      landed.add(note);
    }
    document.body.classList.remove('notes-pending');
  });
}
