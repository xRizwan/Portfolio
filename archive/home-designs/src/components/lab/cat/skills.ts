// Skills pantry: one jar open at a time. Opening a jar moves the ginger cat onto its shelf and
// throws the group's items from the jar to where they land in the list.
import { motionAllowed, select, selectAll } from '../../../scripts/motion';

export function initSkills(): void {
  const pantry = select('[data-cat-pantry]', HTMLElement);
  if (!pantry) return;
  const jars = selectAll('[data-cat-jar]', HTMLButtonElement, pantry);
  const spills = selectAll('[data-cat-spill]', HTMLElement, pantry);
  const cat = select('[data-cat-jar-cat]', HTMLElement, pantry);
  const first = jars[0];
  if (!first) return;

  const open = (jar: HTMLButtonElement, animate: boolean): void => {
    jars.forEach((other) => {
      const on = other === jar;
      other.classList.toggle('is-tipped', on);
      other.setAttribute('aria-expanded', String(on));
    });
    const spill = spills.find((item) => item.dataset.catSpill === jar.dataset.catJar);
    spills.forEach((item) => item.classList.toggle('is-open', item === spill));

    const top = jar.querySelector('.cat-jar-top');
    if (cat && top) {
      top.prepend(cat);
      cat.classList.remove('is-pop');
      // Restart the pop-in animation on the new shelf.
      void cat.offsetWidth;
      cat.classList.add('is-pop');
    }

    if (!animate || !spill) return;
    // On a phone the table can be a screen below the jars, so bring it into view.
    spill.scrollIntoView({ block: 'nearest', behavior: motionAllowed() ? 'smooth' : 'auto' });
    if (!motionAllowed()) return;
    const from = (top ?? jar).getBoundingClientRect();
    const startX = from.left + from.width * 0.8;
    const startY = from.top + from.height * 0.7;
    spill.querySelectorAll('li').forEach((tag, index) => {
      const box = tag.getBoundingClientRect();
      const dx = startX - (box.left + box.width / 2);
      const dy = startY - (box.top + box.height / 2);
      const spin = (Math.random() - 0.5) * 120;
      tag.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) rotate(${spin}deg) scale(0.3)`, opacity: 0 },
          { opacity: 1, offset: 0.25 },
          { transform: 'translate(0, -8px) rotate(0deg) scale(1.04)', offset: 0.8 },
          { transform: 'none', opacity: 1 },
        ],
        {
          duration: 560 + Math.random() * 240,
          delay: 140 + index * 26,
          easing: 'cubic-bezier(0.25, 0.8, 0.35, 1)',
          fill: 'backwards',
        },
      );
    });
  };

  pantry.classList.add('is-live');
  open(first, false);
  jars.forEach((jar) => jar.addEventListener('click', () => open(jar, true)));
}
