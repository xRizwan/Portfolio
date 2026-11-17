// The pinned opening. Scroll position through the tall launch section is turned into one number,
// `p` from 0 to 1, and every part of the scene reads its own stretch of it:
//
//   0.00 – 0.14  on the pad: the five lamps come on one by one and the rocket starts to rattle
//   0.14 – 0.20  ignition: the flame lights, smoke starts to roll out
//   0.20 – 0.56  lift-off: smoke fills the frame, the ground drops away, clouds go past
//   0.40 – 0.68  the dusk colour fades and the stars come through
//   0.62 – 0.80  the two boosters let go and tumble away
//   0.86 – 0.985 the rocket turns over and flies into the lane, where ship.ts takes over
import { select, selectAll } from '../../../scripts/motion';
import { clamp01, easeIn, easeInOut, easeOut, mix, onFrame, span } from './frame';
import type { Ship } from './ship';

interface Puff {
  element: HTMLElement;
  x: number;
  y: number;
  size: number;
  turn: number;
  wait: number;
}

const HANDOVER = 0.985;

export function initLaunch(ship: Ship): void {
  const section = select('[data-sp-launch]', HTMLElement);
  const stage = select('[data-l-stage]', HTMLElement);
  const ground = select('[data-l-ground]', HTMLElement);
  const smoke = select('[data-l-smoke]', HTMLElement);
  const dusk = select('[data-l-dusk]', HTMLElement);
  const rocket = select('[data-l-rocket]', HTMLElement);
  const shake = select('[data-l-shake]', HTMLElement);
  const flame = select('[data-l-flame]', HTMLElement);
  const copy = select('[data-l-copy]', HTMLElement);
  const board = select('[data-l-board]', HTMLElement);
  const arrival = select('[data-l-planet]', HTMLElement);
  if (!section || !stage || !ground || !smoke || !dusk || !rocket || !shake || !flame) {
    ship.show(true);
    return;
  }

  const boosters = selectAll('[data-l-booster]', HTMLElement, stage).map((element) => ({
    element,
    side: Number(element.dataset.booster) < 0 ? -1 : 1,
  }));
  const puffs: Puff[] = selectAll('[data-l-puff]', HTMLElement, stage).map((element) => ({
    element,
    x: Number(element.dataset.x),
    y: Number(element.dataset.y),
    size: Number(element.dataset.size),
    turn: Number(element.dataset.turn),
    wait: Number(element.dataset.wait),
  }));
  const clouds = selectAll('[data-l-cloud]', HTMLElement, stage);
  const lamps = selectAll('[data-l-lamp]', HTMLElement, stage);
  const statuses = selectAll('[data-l-status] span', HTMLElement, stage);

  let stageHeight = 1;
  let sceneHeight = 1;
  let travel = 1;
  let restX = 0;
  let restY = 0;
  let rocketWide = 1;
  let rocketTall = 1;
  let lastStatus = -1;
  let lastLamps = -1;

  // An arrow function, so the null checks above still hold inside it.
  const measure = (): void => {
    stageHeight = stage.offsetHeight;
    sceneHeight = ground.offsetHeight;
    travel = Math.max(1, section.offsetHeight - stageHeight);
    rocketWide = rocket.offsetWidth;
    rocketTall = rocket.offsetHeight;
    // offsetLeft ignores the centring `translate`, so it is already the centre line.
    restX = rocket.offsetLeft;
    restY = rocket.offsetTop + rocketTall / 2;
  };

  measure();
  addEventListener('resize', measure);

  onFrame(
    (state) => {
      const p = clamp01(state.scrollY / travel);
      ship.show(p >= HANDOVER);
      // Nothing of the stage is on screen once the section has gone by.
      if (state.scrollY > travel + stageHeight) return;
      const time = state.time;

      // Countdown lamps and the status line.
      const lit = Math.min(lamps.length, Math.floor(span(p, 0.012, 0.14) * lamps.length + 0.001));
      if (lit !== lastLamps) {
        lastLamps = lit;
        lamps.forEach((lamp, index) => lamp.classList.toggle('is-on', index < lit));
      }
      const status = p < 0.14 ? 0 : p < 0.2 ? 1 : p < 0.62 ? 2 : p < 0.82 ? 3 : 4;
      if (status !== lastStatus) {
        lastStatus = status;
        statuses.forEach((line, index) => line.classList.toggle('is-on', index === status));
        stage.classList.toggle('is-lit', status > 0);
      }
      if (board) board.style.opacity = String(1 - span(p, 0.9, 0.97));

      // Rattle: builds on the pad, peaks at ignition, dies away in the climb.
      const rattle =
        (2.2 * span(p, 0.02, 0.14) + 4.5 * span(p, 0.14, 0.2)) * (1 - span(p, 0.3, 0.6));
      const rattleX = (Math.sin(time * 61) + Math.sin(time * 37.3)) * 0.5 * rattle;
      const rattleY = Math.sin(time * 53.7) * 0.5 * rattle;
      shake.style.transform = `translate3d(${rattleX}px, ${rattleY}px, 0)`;

      // Ground and smoke fall away together; the cursor slides the scenery a touch.
      const drop = easeIn(span(p, 0.2, 0.56)) * stageHeight * 1.6;
      const slide = -state.pointerX * 12 * (1 - span(p, 0.2, 0.5));
      const fall = `translate3d(${slide - rattleX * 0.3}px, ${drop}px, 0)`;
      ground.style.transform = fall;
      smoke.style.transform = fall;
      // Once the ground is gone, take it out of the picture, so its painted sky never shows
      // at the bottom of the stage as the stage scrolls away.
      const away = p > 0.6 ? 'hidden' : 'visible';
      ground.style.visibility = away;
      smoke.style.visibility = away;
      dusk.style.opacity = String(1 - span(p, 0.4, 0.68));

      for (const puff of puffs) {
        const grow = easeOut(span(p, 0.135 + puff.wait, 0.33 + puff.wait));
        const breathe = 1 + Math.sin(time * 1.7 + puff.turn) * 0.03;
        puff.element.style.opacity = String(Math.min(1, grow * 5));
        puff.element.style.transform = `translate3d(${puff.x * sceneHeight * grow}px, ${puff.y * sceneHeight * grow}px, 0) rotate(${puff.turn * grow}deg) scale(${mix(0.12, puff.size, grow) * breathe})`;
      }
      clouds.forEach((cloud, index) => {
        const pass = span(p, 0.24 + index * 0.06, 0.42 + index * 0.06);
        cloud.style.opacity = pass > 0 && pass < 1 ? '0.92' : '0';
        cloud.style.transform = `translate3d(0, ${mix(-0.6, 1.25, pass) * stageHeight}px, 0)`;
      });

      // Flame: lights at ignition, eases back once the boosters are gone, and always answers the
      // scroll speed.
      const lit01 = span(p, 0.14, 0.2);
      const burn =
        lit01 *
        (mix(1.3, 0.62, span(p, 0.66, 0.82)) +
          Math.min(0.6, Math.abs(state.velocity) / 2600) +
          Math.sin(time * 43) * 0.06);
      flame.style.opacity = lit01 > 0 ? '1' : '0';
      flame.style.transform = `scale(${0.75 + 0.25 * lit01}, ${burn})`;

      const split = span(p, 0.62, 0.8);
      for (const booster of boosters) {
        const out = booster.side * easeOut(split) * rocketWide * 0.95;
        const down = easeIn(split) * rocketTall * 1.7;
        booster.element.style.opacity = String(1 - span(split, 0.72, 1));
        booster.element.style.transform = `translate3d(${out}px, ${down}px, 0) rotate(${booster.side * split * 150}deg)`;
      }

      // The rocket itself: up to the middle of the frame, a slow sway while it climbs, then over
      // to wherever the lane's ship is waiting.
      const lift = easeInOut(span(p, 0.2, 0.5));
      const flightScale = Math.min(1, (stageHeight * 0.5) / rocketTall);
      const sway = Math.sin(time * 0.8) * 7 * lift;
      let x = restX + sway;
      let y = mix(restY, stageHeight * 0.5, lift);
      let scale = mix(1, flightScale, lift);
      let turn = Math.sin(time * 0.6) * 2.2 * lift;
      const spot = ship.spot();
      const hand = easeInOut(span(p, 0.86, HANDOVER));
      if (spot && hand > 0) {
        x = mix(x, spot.x, hand);
        y = mix(y, spot.y, hand);
        scale = mix(scale, spot.tall / rocketTall, hand);
        turn = mix(turn, 180, hand);
      }
      rocket.style.opacity = p >= HANDOVER ? '0' : '1';
      rocket.style.transform = `translate3d(${x - restX}px, ${y - restY}px, 0) rotate(${turn}deg) scale(${scale})`;

      // The first planet of the trip slides in from the right while the rocket coasts.
      if (arrival) {
        const come = easeOut(span(p, 0.6, 1));
        arrival.style.opacity = come > 0 ? '1' : '0';
        arrival.style.transform = `translate3d(${(1 - come) * 70}vw, ${(1 - come) * 30 - state.pointerY * 10}px, 0) rotate(${(1 - come) * 40 - 8}deg)`;
      }

      if (copy) {
        const gone = span(p, 0.19, 0.29);
        copy.style.opacity = String(1 - gone);
        copy.style.transform = `translate3d(0, ${-46 * gone}px, 0)`;
        copy.style.visibility = gone >= 1 ? 'hidden' : 'visible';
      }
    },
    () => {
      // Motion off: clear what the script set so the still scene from the stylesheet shows.
      const pieces: HTMLElement[] = [
        ground,
        smoke,
        dusk,
        rocket,
        shake,
        flame,
        ...boosters.map((booster) => booster.element),
        ...puffs.map((puff) => puff.element),
        ...clouds,
      ];
      if (copy) pieces.push(copy);
      if (board) pieces.push(board);
      if (arrival) pieces.push(arrival);
      for (const piece of pieces) {
        piece.style.transform = '';
        piece.style.opacity = '';
        piece.style.visibility = '';
      }
      lastLamps = -1;
      lastStatus = -1;
      ship.show(false);
      requestAnimationFrame(measure);
    },
  );
}
