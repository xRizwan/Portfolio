// Entry point for the "Night train" trial page: one animation loop that the scenes share.
import { finePointer, motionAllowed, select, selectAll } from '../../../scripts/motion';
import { initCases } from './cases';
import { clamp, type Tick } from './frame';
import { initJourney } from './journey';
import { Flock } from './moths';
import { initOpening } from './opening';
import { initViewer } from './viewer';

type Scene = (tick: Tick) => void;

/** Moths round a fixed lamp (the one over the platform). */
function initLampMoths(): Scene[] {
  return selectAll('[data-tr-moths]', HTMLElement).flatMap((box) => {
    const lamp = select('[data-tr-lamp]', HTMLElement, box);
    if (!lamp) return [];
    const flock = new Flock(box, Number(box.dataset.trMoths ?? '2'));
    return [
      (tick: Tick): void => {
        const rect = box.getBoundingClientRect();
        // Hidden (on phones) or off screen: nothing to fly round.
        if (rect.width === 0 || rect.bottom < 0 || rect.right < 0) {
          flock.homes = [];
        } else {
          flock.homes = [{ x: lamp.offsetLeft, y: lamp.offsetTop }];
        }
        const pointer = tick.pointer
          ? { x: tick.pointer.x - rect.left, y: tick.pointer.y - rect.top }
          : null;
        flock.update(tick, pointer);
      },
    ];
  });
}

/** The last stop: first light rises as the section scrolls into view. */
function initArrival(): Scene | null {
  const section = select('[data-tr-arrival]', HTMLElement);
  const picture = select('[data-tr-dawn-art]', HTMLElement);
  if (!section) return null;
  return () => {
    const rect = section.getBoundingClientRect();
    const view = window.innerHeight;
    if (rect.top > view || rect.bottom < 0) return;
    const rise = clamp((view - rect.top) / (view * 0.85));
    section.style.setProperty('--tr-rise', rise.toFixed(3));
    if (picture) picture.style.transform = `translate3d(0,${((rise - 1) * 6).toFixed(2)}%,0)`;
  };
}

function start(): void {
  initViewer();
  const openNear = initCases();
  const scenes: Scene[] = [initOpening(), initJourney(openNear), initArrival()].filter(
    (scene): scene is Scene => scene !== null,
  );
  scenes.push(...initLampMoths());

  let pointer: Tick['pointer'] = null;
  if (finePointer.matches) {
    addEventListener('pointermove', (event) => {
      pointer = { x: event.clientX, y: event.clientY };
    });
    document.addEventListener('pointerleave', () => {
      pointer = null;
    });
  }

  let before = performance.now();
  let lastY = window.scrollY;
  let velocity = 0;
  const frame = (now: number): void => {
    const dt = Math.min(0.05, Math.max(0.001, (now - before) / 1000));
    before = now;
    const scrollY = window.scrollY;
    velocity += ((scrollY - lastY) / dt - velocity) * Math.min(1, dt * 9);
    lastY = scrollY;
    const tick: Tick = { now, dt, scrollY, velocity, live: motionAllowed(), pointer };
    for (const scene of scenes) scene(tick);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

start();
