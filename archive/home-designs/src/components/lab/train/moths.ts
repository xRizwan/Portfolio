// Moths. They circle the lamps, go to the cursor when it comes near, and scatter when the
// reader scrolls hard. They are drawn underneath the cards, so they never cover any text.
import type { Tick } from './frame';

export interface Point {
  x: number;
  y: number;
}

interface Moth {
  element: HTMLElement;
  x: number;
  y: number;
  angle: number;
  turn: number;
  reach: number;
  flap: number;
  placed: boolean;
}

const PULL = 300;

export class Flock {
  /** Lamp positions in the container's own coordinates. */
  homes: Point[] = [];
  private readonly moths: Moth[];

  constructor(container: HTMLElement, count: number) {
    this.moths = Array.from({ length: count }, (_, index) => {
      const element = document.createElement('span');
      element.className = 'tr-moth';
      element.style.opacity = '0';
      container.append(element);
      return {
        element,
        x: 0,
        y: 0,
        angle: Math.random() * Math.PI * 2,
        turn: (1.5 + Math.random() * 1.4) * (index % 2 === 0 ? 1 : -1),
        reach: 20 + Math.random() * 30,
        flap: Math.random() * 6,
        placed: false,
      };
    });
  }

  /** `pointer` is in the container's coordinates, or null when there is none. */
  update(tick: Tick, pointer: Point | null): void {
    if (!tick.live || this.homes.length === 0) {
      for (const moth of this.moths) moth.element.style.opacity = '0';
      return;
    }
    const scatter = Math.min(120, Math.abs(tick.velocity) / 26);
    this.moths.forEach((moth, index) => {
      const home = this.homes[index % this.homes.length];
      if (!home) return;
      let centre = home;
      let reach = moth.reach + scatter;
      if (pointer && Math.hypot(pointer.x - home.x, pointer.y - home.y) < PULL) {
        centre = pointer;
        reach = 16 + (moth.reach - 20) * 0.5 + scatter;
      }
      moth.angle += moth.turn * tick.dt;
      moth.flap += tick.dt * 26;
      const wobble = Math.sin(moth.angle * 2.7 + index) * 7;
      const goalX = centre.x + Math.cos(moth.angle) * (reach + wobble);
      const goalY = centre.y + Math.sin(moth.angle) * (reach * 0.62 + wobble);
      if (!moth.placed) {
        moth.placed = true;
        moth.x = goalX;
        moth.y = goalY;
      }
      const ease = Math.min(1, tick.dt * 3.4);
      const stepX = (goalX - moth.x) * ease;
      const stepY = (goalY - moth.y) * ease;
      moth.x += stepX;
      moth.y += stepY;
      const heading = (Math.atan2(stepY, stepX) * 180) / Math.PI + 90;
      const wings = 0.5 + Math.abs(Math.sin(moth.flap)) * 0.5;
      moth.element.style.opacity = '1';
      moth.element.style.transform = `translate3d(${moth.x.toFixed(1)}px,${moth.y.toFixed(1)}px,0) rotate(${heading.toFixed(0)}deg) scaleX(${wings.toFixed(2)})`;
    });
  }
}
