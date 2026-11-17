// The experience route. The line is built from where the waypoints actually are on the page, so
// it stays right when a mission log is opened or the layout changes. It runs straight down the
// empty column beside each card and only crosses over in the gap between two cards, which keeps
// the line, and the cat riding it, off the text.
import { motionAllowed, select, selectAll } from '../../../scripts/motion';
import { clamp01, onFrame } from './frame';

interface Waypoint {
  item: HTMLElement;
  dot: HTMLElement;
  /** Distance along the route at which this waypoint is reached. */
  at: number;
}

export function initFlight(): void {
  const root = select('[data-sp-flight]', HTMLElement);
  const svg = root?.querySelector('[data-sp-route]');
  const plan = root?.querySelector('[data-sp-route-plan]');
  const done = root?.querySelector('[data-sp-route-done]');
  const rider = root ? select('[data-sp-rider]', HTMLElement, root) : null;
  if (
    !root ||
    !(svg instanceof SVGSVGElement) ||
    !(plan instanceof SVGPathElement) ||
    !(done instanceof SVGPathElement)
  ) {
    return;
  }

  const waypoints: Waypoint[] = [];
  for (const item of selectAll('[data-sp-way]', HTMLElement, root)) {
    const dot = select('[data-sp-way-dot]', HTMLElement, item);
    if (dot) waypoints.push({ item, dot, at: 0 });
  }
  let length = 0;

  const finish = (): void => {
    done.style.strokeDashoffset = '0';
    rider?.classList.remove('is-riding');
    for (const waypoint of waypoints) waypoint.item.classList.add('is-reached');
  };

  const build = (): void => {
    const frame = root.getBoundingClientRect();
    if (frame.width === 0 || waypoints.length === 0) return;
    svg.setAttribute('viewBox', `0 0 ${frame.width} ${frame.height}`);
    const points = waypoints.map((waypoint) => {
      const dot = waypoint.dot.getBoundingClientRect();
      const item = waypoint.item.getBoundingClientRect();
      return {
        x: dot.left + dot.width / 2 - frame.left,
        y: dot.top + dot.height / 2 - frame.top,
        bottom: item.bottom - frame.top,
      };
    });
    const first = points[0];
    if (!first) return;
    let path = `M${first.x.toFixed(1)} -40L${first.x.toFixed(1)} ${first.y.toFixed(1)}`;
    const marks: number[] = [];
    for (let index = 1; index < points.length; index++) {
      const from = points[index - 1];
      const to = points[index];
      if (!from || !to) continue;
      // Straight down beside the previous card, then an S across the gap to the next waypoint.
      const turn = Math.max(from.y + 10, from.bottom);
      const band = to.y - turn;
      path += `L${from.x.toFixed(1)} ${turn.toFixed(1)}`;
      path += `C${from.x.toFixed(1)} ${(turn + band * 0.5).toFixed(1)} ${to.x.toFixed(1)} ${(turn + band * 0.5).toFixed(1)} ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
    }
    const last = points[points.length - 1];
    if (last) path += `L${last.x.toFixed(1)} ${(last.bottom + 30).toFixed(1)}`;
    plan.setAttribute('d', path);
    done.setAttribute('d', path);
    length = done.getTotalLength();
    done.style.strokeDasharray = `${length}`;

    // How far along the route each waypoint sits: walk the line until it gets down to the dot.
    let walked = 0;
    for (const point of points) {
      while (walked < length && done.getPointAtLength(walked).y < point.y - 1) walked += 6;
      marks.push(walked);
    }
    waypoints.forEach((waypoint, index) => {
      waypoint.at = marks[index] ?? 0;
    });
    if (!motionAllowed()) finish();
  };

  build();
  // Opening a log, a font arriving or a resize all move the waypoints.
  new ResizeObserver(build).observe(root);

  onFrame((state) => {
    if (length === 0) return;
    const frame = root.getBoundingClientRect();
    if (frame.bottom < -200 || frame.top > state.height + 200) return;
    // The route is filled in down to a line 58% of the way down the screen.
    const progress = clamp01((state.height * 0.58 - frame.top) / frame.height);
    const reached = progress * length;
    done.style.strokeDashoffset = `${length - reached}`;
    for (const waypoint of waypoints) {
      waypoint.item.classList.toggle('is-reached', reached >= waypoint.at);
    }
    if (rider) {
      const tip = done.getPointAtLength(reached);
      const ahead = done.getPointAtLength(Math.min(length, reached + 8));
      // Lean into sideways movement; bob a little the rest of the time.
      const lean = Math.max(-28, Math.min(28, (ahead.x - tip.x) * 5));
      const bob = Math.sin(state.time * 2.2) * 3;
      rider.classList.toggle('is-riding', progress > 0.005 && progress < 0.995);
      rider.style.transform = `translate3d(${tip.x}px, ${tip.y + bob}px, 0) translate(-50%, -50%) rotate(${lean + Math.sin(state.time * 1.4) * 6}deg)`;
    }
  }, finish);
}
