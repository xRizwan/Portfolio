// The skills system. Planets ride four elliptical orbits; the script only moves buttons that are
// already in the page, and moves each group's card into the read-out beside the system.
// Pointing at the system (or tabbing into it) holds it still so a planet can be picked, and fast
// scrolling spins it up for a moment.
import { select, selectAll } from '../../../scripts/motion';
import { onFrame } from './frame';

interface Planet {
  button: HTMLButtonElement;
  panel: HTMLElement;
  ring: number;
  /** Starting angle in radians. */
  phase: number;
}

/** Orbit size as a share of the available radius, inner orbit first. */
const REACH = [0.42, 0.61, 0.8, 1] as const;
/** Radians per second, inner orbit first: the nearer the sun, the quicker the year. */
const RATE = [0.17, 0.11, 0.078, 0.054] as const;

export function initSkills(): void {
  const root = select('[data-sp-orrery]', HTMLElement);
  const box = root ? select('[data-sp-orbits]', HTMLElement, root) : null;
  const slot = root ? select('[data-sp-readout-slot]', HTMLElement, root) : null;
  if (!root || !box || !slot) return;

  const planets: Planet[] = [];
  for (const group of selectAll('[data-sp-group]', HTMLElement, root)) {
    const button = select('[data-sp-planet]', HTMLButtonElement, group);
    const panel = select('[data-sp-panel]', HTMLElement, group);
    if (!button || !panel) continue;
    planets.push({
      button,
      panel,
      ring: Number(group.dataset.ring),
      phase: (Number(group.dataset.phase) * Math.PI) / 180,
    });
    slot.append(panel);
  }
  const rings = selectAll('[data-sp-orbit]', HTMLElement, root);

  let active = -1;
  let radiusX = 100;
  let radiusY = 80;
  let turn = 0;
  let pace = 1;
  let held = false;

  const activate = (index: number): void => {
    const count = planets.length;
    if (count === 0) return;
    active = ((index % count) + count) % count;
    planets.forEach((planet, at) => {
      const on = at === active;
      planet.button.classList.toggle('is-active', on);
      planet.button.setAttribute('aria-expanded', String(on));
      planet.panel.classList.toggle('is-active', on);
    });
    place();
  };

  const place = (): void => {
    for (const planet of planets) {
      const reach = REACH[planet.ring] ?? 1;
      const angle = planet.phase + turn * (RATE[planet.ring] ?? 0.05);
      const x = Math.cos(angle) * radiusX * reach;
      const y = Math.sin(angle) * radiusY * reach;
      planet.button.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      // Planets on the near side of an orbit pass in front of those on the far side.
      // The chosen planet always stays on top, so its name tag is never covered.
      const lift = planet.button.classList.contains('is-active') ? 1000 : 100;
      planet.button.style.zIndex = String(lift + Math.round(y));
    }
  };

  const measure = (): void => {
    // Leave room at the edge for the biggest planet and its name tag.
    const margin = box.clientWidth < 520 ? 34 : 58;
    radiusX = Math.max(60, box.clientWidth / 2 - margin);
    radiusY = Math.max(50, box.clientHeight / 2 - margin);
    rings.forEach((ring, index) => {
      const reach = REACH[index] ?? 1;
      ring.style.width = `${radiusX * 2 * reach}px`;
      ring.style.height = `${radiusY * 2 * reach}px`;
    });
    place();
  };

  planets.forEach((planet, index) => {
    planet.button.addEventListener('click', () => activate(index));
  });
  select('[data-sp-prev]', HTMLButtonElement, root)?.addEventListener('click', () =>
    activate(active - 1),
  );
  select('[data-sp-next]', HTMLButtonElement, root)?.addEventListener('click', () =>
    activate(active + 1),
  );
  box.addEventListener('pointerenter', () => {
    held = true;
  });
  box.addEventListener('pointerleave', () => {
    held = false;
  });
  box.addEventListener('focusin', () => {
    held = true;
  });
  box.addEventListener('focusout', () => {
    held = false;
  });

  activate(0);
  measure();
  new ResizeObserver(measure).observe(box);

  onFrame((state) => {
    // Ease to a stop when held and back up to speed when let go.
    pace += ((held ? 0 : 1) - pace) * Math.min(1, state.dt * 5);
    const rush = held ? 0 : Math.min(9, Math.abs(state.velocity) / 420);
    turn += state.dt * (pace + rush);
    place();
  }, place);
}
