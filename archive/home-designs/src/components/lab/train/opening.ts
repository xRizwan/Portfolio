// The pinned opening: platform, whistle, departure, open country, and in through a window.
import { select, selectAll } from '../../../scripts/motion';
import { clamp, pinned, smooth, type Tick } from './frame';
import { Outside } from './outside';

const LINE_SPEED = 170;

export function initOpening(): ((tick: Tick) => void) | null {
  const section = select('[data-tr-opening]', HTMLElement);
  const pin = select('[data-tr-op-pin]', HTMLElement);
  const scene = select('[data-tr-op-scene]', HTMLElement);
  const world = select('[data-tr-op-world]', HTMLElement);
  const train = select('[data-tr-op-train]', HTMLElement);
  const target = select('[data-tr-op-target]', HTMLElement);
  const platform = select('[data-tr-op-platform]', HTMLElement);
  const canopy = select('[data-tr-op-canopy]', HTMLElement);
  const ticket = select('[data-tr-op-ticket]', HTMLElement);
  const wash = select('[data-tr-op-wash]', HTMLElement);
  const out = section ? select('[data-tr-out]', HTMLElement, section) : null;
  if (
    !section ||
    !pin ||
    !scene ||
    !world ||
    !train ||
    !target ||
    !platform ||
    !canopy ||
    !ticket ||
    !wash ||
    !out
  ) {
    return null;
  }
  const station = select('.tr-op-station', HTMLImageElement, world);
  const city = select('[data-tr-city]', HTMLElement, out);
  const hills = select('[data-tr-hills]', HTMLElement, out);
  const puffs = selectAll('[data-tr-steam] i', HTMLElement, section);
  const outside = new Outside(out, { poleTop: 0.4, poleFoot: 0.86 });

  let width = 0;
  let height = 0;
  let worldSpan = 0;
  let targetX = 0;
  let targetY = 0;
  let drift = 0;
  let steam = 0;
  let gone = false;

  const measure = (): void => {
    width = pin.clientWidth;
    height = pin.clientHeight;
    worldSpan = (station ? station.offsetLeft + station.offsetWidth : width) + width * 0.1;
    const car = target.offsetParent instanceof HTMLElement ? target.offsetParent : null;
    targetX = train.offsetLeft + (car?.offsetLeft ?? 0) + target.offsetLeft;
    targetY = train.offsetTop + (car?.offsetTop ?? 0) + target.offsetTop;
    outside.resize();
  };
  measure();
  addEventListener('resize', measure);
  // The train is laid out from its pictures, so measure again once they have their sizes.
  addEventListener('load', measure);

  if (!pinned()) {
    // The still scene: rain caught mid-fall, nothing else.
    outside.render({ distance: 0, dt: 0, pace: 0, wires: 0, rain: 1 });
    addEventListener('resize', () =>
      outside.render({ distance: 0, dt: 0, pace: 0, wires: 0, rain: 1 }),
    );
    return null;
  }

  return (tick) => {
    const rect = section.getBoundingClientRect();
    if (rect.bottom <= 0) {
      if (!gone) {
        gone = true;
        pin.style.visibility = 'hidden';
      }
      return;
    }
    const p = clamp(-rect.top / Math.max(1, section.offsetHeight - height));
    gone = p >= 1;
    pin.style.visibility = gone ? 'hidden' : 'visible';
    if (gone) return;

    // Stage two: the whistle. Stage three: the station slides away, slowly at first.
    const whistle = smooth(0.06, 0.12, p) * (1 - smooth(0.2, 0.3, p));
    const moving = smooth(0.2, 0.42, p);
    const departed = smooth(0.2, 0.56, p) ** 2;
    if (tick.live) {
      drift += moving * LINE_SPEED * tick.dt * (1 + Math.abs(tick.velocity) / 1500);
      steam += (0.16 + 0.55 * whistle + 0.5 * moving) * tick.dt;
    }
    const slide = -departed * worldSpan;
    world.style.transform = `translate3d(${slide.toFixed(1)}px,0,0)`;
    platform.style.transform = `translate3d(${(slide * 1.25).toFixed(1)}px,0,0)`;
    canopy.style.transform = `translate3d(${(slide * 1.4).toFixed(1)}px,0,0)`;

    // Stage four: open country. The town fades out behind and the hills take over.
    if (city) city.style.opacity = (1 - smooth(0.5, 0.66, p)).toFixed(3);
    if (hills) hills.style.opacity = smooth(0.42, 0.6, p).toFixed(3);
    outside.render({
      distance: departed * width * 2.6 + smooth(0.5, 1, p) * width * 1.2 + drift,
      dt: tick.live ? tick.dt : 0,
      pace: moving + Math.abs(tick.velocity) / 2500,
      wires: smooth(0.5, 0.62, p),
      rain: 1,
    });

    // The camera drifts back along the train to a lit window, then goes in through it.
    const pan = smooth(0.5, 0.74, p);
    const bob = tick.live ? Math.sin(tick.now / 90) * 0.8 * moving : 0;
    train.style.transform = `translate3d(${((width / 2 - targetX) * pan).toFixed(1)}px,${bob.toFixed(2)}px,0)`;
    const zoom = smooth(0.76, 0.95, p);
    scene.style.transformOrigin = `${width / 2}px ${targetY}px`;
    scene.style.transform = zoom > 0 ? `scale(${(1 + zoom ** 3 * 11).toFixed(4)})` : 'none';
    wash.style.opacity = smooth(0.86, 0.94, p).toFixed(3);
    pin.style.opacity = (1 - smooth(0.95, 1, p)).toFixed(3);

    const put = smooth(0.13, 0.27, p);
    ticket.style.transform = `translate3d(0,${(put * 130).toFixed(1)}%,0)`;
    ticket.style.opacity = (1 - smooth(0.18, 0.27, p)).toFixed(3);

    // Steam: slow and upright at the platform, a burst for the whistle, a trail once moving.
    const strength = 0.3 + 0.7 * Math.max(whistle, moving);
    puffs.forEach((puff, index) => {
      const life = (steam + index / puffs.length) % 1;
      const x = -life * (14 + 520 * moving) + Math.sin(life * 6 + index) * 8;
      const y = -life * (150 - 70 * moving) * (0.6 + 0.6 * strength);
      const size = (0.35 + life * 1.5) * (0.7 + 0.5 * strength);
      puff.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${size.toFixed(3)})`;
      puff.style.opacity = (Math.sin(Math.PI * life) * 0.9 * (0.45 + 0.55 * strength)).toFixed(3);
    });
  };
}
