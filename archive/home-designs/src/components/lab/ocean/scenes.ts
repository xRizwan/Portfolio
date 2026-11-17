// Scroll-driven and interactive behaviour for each part of the reef. Every function leaves the
// page readable when motion is off: content is in the HTML and only the movement is added here.
import { motionAllowed, onMotionChange, select, selectAll } from '../../../scripts/motion';
import { burst, gather, setCeiling } from './life';

const clamp = (value: number, min = 0, max = 1): number => Math.min(max, Math.max(min, value));
/** Progress of `value` between `from` and `to`, eased at both ends. */
const range = (value: number, from: number, to: number): number => {
  const t = clamp((value - from) / (to - from));
  return t * t * (3 - 2 * t);
};

/** Runs `update` once per frame while the page scrolls or resizes, and once now. */
function onFrame(update: () => void): void {
  let queued = false;
  const request = (): void => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      update();
    });
  };
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request);
  onMotionChange(request);
  update();
}

/** The pinned opening: above the water, under the surface, the reef, then along the reef. */
export function initIntro(): void {
  const intro = select('[data-oc-intro]', HTMLElement);
  const stage = select('[data-oc-stage]', HTMLElement);
  if (!intro || !stage) return;

  onFrame(() => {
    const still = !motionAllowed();
    intro.classList.toggle('is-still', still);
    const rect = intro.getBoundingClientRect();
    const height = stage.offsetHeight;
    if (still) {
      for (const name of ['--dive', '--reef', '--pan']) stage.style.removeProperty(name);
      // Matches the CSS default of --dive: 0.55.
      setCeiling(rect.top + height * 0.4);
      return;
    }
    const travel = Math.max(1, rect.height - height);
    const progress = clamp(-rect.top / travel);
    const dive = range(progress, 0.06, 0.4);
    const reef = range(progress, 0.34, 0.66);
    const pan = range(progress, 0.7, 0.98);
    stage.style.setProperty('--dive', dive.toFixed(4));
    stage.style.setProperty('--reef', reef.toFixed(4));
    stage.style.setProperty('--pan', pan.toFixed(4));
    // Once the stage unpins, the surface scrolls away with it.
    const stageTop = Math.min(0, rect.bottom - height);
    setCeiling(stageTop + (height * (68 - 51 * dive)) / 100);
    if (reef > 0.3) burst();
    else if (reef < 0.02) gather();
  });
}

/** Rise-in on first view, plus drift (parallax) and line drawing tied to scroll position. */
export function initScrollArt(): void {
  const risers = selectAll('[data-rise]', HTMLElement);
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -12% 0px' },
  );
  for (const riser of risers) observer.observe(riser);

  const drifters = selectAll('[data-drift]', HTMLElement).map((element) => ({
    element,
    anchor: element.closest<HTMLElement>('[data-drift-anchor]') ?? element.parentElement ?? element,
    y: Number(element.dataset.drift ?? 0),
    x: Number(element.dataset.driftX ?? 0),
    turn: Number(element.dataset.driftTurn ?? 0),
  }));
  const lines = selectAll('[data-draw]', SVGPathElement);

  onFrame(() => {
    const moving = motionAllowed();
    const view = innerHeight;
    // Read every position first, then write, so the browser lays the page out only once.
    const offsets = drifters.map(({ anchor }) => {
      const rect = anchor.getBoundingClientRect();
      return clamp((rect.top + rect.height / 2 - view / 2) / view, -1.4, 1.4);
    });
    const drawn = lines.map((line) => {
      const rect = (line.ownerSVGElement ?? line).getBoundingClientRect();
      return clamp((view * 0.8 - rect.top) / Math.max(1, rect.height));
    });
    drifters.forEach(({ element, x, y, turn }, index) => {
      const offset = moving ? (offsets[index] ?? 0) : 0;
      element.style.translate = `${(offset * x).toFixed(1)}px ${(offset * y).toFixed(1)}px`;
      if (turn) element.style.rotate = `${(offset * turn).toFixed(2)}deg`;
    });
    lines.forEach((line, index) => {
      line.style.strokeDashoffset = moving ? (1 - (drawn[index] ?? 1)).toFixed(4) : '0';
    });
  });
}

/** Coral garden: one creature open at a time; its skills float out as bubbles. */
export function initSkills(): void {
  const garden = select('[data-oc-garden]', HTMLElement);
  if (!garden) return;
  const buttons = selectAll('[data-skill-toggle]', HTMLButtonElement, garden);
  const open = (target: HTMLButtonElement | null): void => {
    for (const button of buttons) {
      const panel = document.getElementById(button.getAttribute('aria-controls') ?? '');
      const on = button === target;
      button.setAttribute('aria-expanded', String(on));
      if (panel) panel.hidden = !on;
    }
  };
  for (const button of buttons) {
    button.addEventListener('click', () => {
      open(button.getAttribute('aria-expanded') === 'true' ? null : button);
    });
  }
  garden.classList.add('is-live');
  open(buttons[0] ?? null);
}

/** Experience: the page scrolls down while the current carries the role markers sideways. */
export function initCurrent(): void {
  const section = select('[data-oc-current]', HTMLElement);
  const stage = select('[data-oc-current-stage]', HTMLElement);
  const track = select('[data-oc-track]', HTMLElement);
  if (!section || !stage || !track) return;
  const stops = selectAll('[data-oc-stop]', HTMLElement, track);
  let distance = 0;

  const measure = (): void => {
    // Phones keep the vertical list: a sideways track of wide cards is awkward on a narrow screen.
    const pinned = motionAllowed() && matchMedia('(min-width: 861px)').matches;
    section.classList.toggle('is-pinned', pinned);
    if (!pinned) {
      section.style.removeProperty('height');
      track.style.removeProperty('transform');
      stage.style.removeProperty('--flow');
      return;
    }
    distance = Math.max(0, track.scrollWidth - stage.clientWidth);
    section.style.height = `${stage.offsetHeight + distance}px`;
  };
  measure();
  addEventListener('resize', measure);
  onMotionChange(measure);
  // Fonts and images can change the track width after the first measurement.
  addEventListener('load', measure);

  onFrame(() => {
    if (!section.classList.contains('is-pinned')) return;
    const progress = clamp(-section.getBoundingClientRect().top / Math.max(1, distance));
    track.style.transform = `translate3d(${(-progress * distance).toFixed(1)}px, 0, 0)`;
    stage.style.setProperty('--flow', progress.toFixed(4));
    const middle = innerWidth / 2;
    for (const stop of stops) {
      const rect = stop.getBoundingClientRect();
      stop.classList.toggle('is-here', rect.left < middle + 80 && rect.right > middle - 80);
    }
  });
}

/** Oyster bed: opens a certificate full size in a dialog, with previous and next. */
export function initPearls(): void {
  const dialog = select('[data-oc-cert-dialog]', HTMLDialogElement);
  if (!dialog) return;
  const image = select('img', HTMLImageElement, dialog);
  const title = select('[data-cert-title]', HTMLElement, dialog);
  const issuer = select('[data-cert-issuer]', HTMLElement, dialog);
  const links = selectAll('[data-cert]', HTMLAnchorElement);
  if (!image || !title || !issuer || links.length === 0) return;
  let current = 0;

  const show = (index: number): void => {
    current = (index + links.length) % links.length;
    const link = links[current];
    if (!link) return;
    image.src = link.href;
    image.alt = link.dataset.alt ?? '';
    image.width = Number(link.dataset.width ?? 1600);
    image.height = Number(link.dataset.height ?? 1200);
    title.textContent = link.dataset.cert ?? '';
    issuer.textContent = link.dataset.issuer ?? '';
  };
  links.forEach((link, index) => {
    link.addEventListener('click', (event) => {
      // Leave modified clicks alone so the image can still open in a new tab.
      if (event.metaKey || event.ctrlKey || event.shiftKey) return;
      event.preventDefault();
      show(index);
      dialog.showModal();
    });
  });
  select('[data-cert-prev]', HTMLButtonElement, dialog)?.addEventListener('click', () => {
    show(current - 1);
  });
  select('[data-cert-next]', HTMLButtonElement, dialog)?.addEventListener('click', () => {
    show(current + 1);
  });
  select('[data-cert-close]', HTMLButtonElement, dialog)?.addEventListener('click', () => {
    dialog.close();
  });
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') show(current - 1);
    if (event.key === 'ArrowRight') show(current + 1);
  });
  // A click on the dimmed area around the sheet closes it.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    links[current]?.focus();
  });
}
