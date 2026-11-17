// Scroll story for the pinned opening. Progress `p` runs 0 to 1 over the section:
//   0.00  afternoon, the ginger cat asleep on the bookcase
//   0.12  it wakes and stretches
//   0.22  walks along the bookcase to the vase
//   0.50  bats the vase off the end; it falls and bounces
//   0.45  the kitten chases a ball of yarn across the floor, unrolling a thread
//   0.62  dusk has fallen and the lamp comes on
//   0.90  the ball rolls out of the bottom of the room, where the page's thread picks it up
import { motionAllowed, onMotionChange, select } from '../../../scripts/motion';
import { clamp, lerp, onFrame, ramp, span } from './ticker';

export function initOpening(): void {
  const section = select('[data-cat-open]', HTMLElement);
  const stage = select('[data-cat-open-stage]', HTMLElement);
  const bookcase = select('[data-cat-open-case]', HTMLElement);
  const ginger = select('[data-cat-open-ginger]', HTMLElement);
  const vase = select('[data-cat-open-vase]', HTMLElement);
  const kitten = select('[data-cat-open-kitten]', HTMLElement);
  const ball = select('[data-cat-open-ball]', HTMLElement);
  const sky = select('[data-cat-open-sky]', HTMLElement);
  const dusk = select('[data-cat-open-dusk]', HTMLElement);
  const night = select('[data-cat-open-night]', HTMLElement);
  const glow = select('[data-cat-open-glow]', HTMLElement);
  const hint = select('[data-cat-open-hint]', HTMLElement);
  const threadSvg = select('[data-cat-open-thread]', SVGSVGElement);
  if (
    !section ||
    !stage ||
    !bookcase ||
    !ginger ||
    !vase ||
    !kitten ||
    !ball ||
    !sky ||
    !dusk ||
    !night ||
    !glow ||
    !threadSvg
  ) {
    return;
  }
  const threads = [...threadSvg.querySelectorAll('path')];

  let width = 0;
  let height = 0;
  let caseW = 0;
  let caseH = 0;
  let exitX = 0;
  let ballSize = 0;
  let ballBase = 0;
  let ballLine = 0;
  let kittenBase = 0;
  let kittenW = 0;
  let last = -1;
  let blinkAt = 0;

  const measure = (): void => {
    width = stage.clientWidth;
    height = stage.clientHeight;
    caseW = bookcase.offsetWidth;
    caseH = bookcase.offsetHeight;
    exitX = (parseFloat(getComputedStyle(stage).getPropertyValue('--exit-x')) / 100) * width;
    ballSize = ball.offsetWidth;
    ballBase = ball.offsetLeft;
    // The thread lies on the floor under the ball.
    ballLine = ball.offsetTop + ballSize * 0.86;
    kittenBase = kitten.offsetLeft;
    kittenW = kitten.offsetWidth;
    threadSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    last = -1;
  };

  const setPose = (element: HTMLElement, pose: string): void => {
    if (element.dataset.pose !== pose) element.dataset.pose = pose;
  };

  const draw = (p: number, now: number): void => {
    // Ginger cat on the bookcase
    const walk = ramp(p, 0.22, 0.5);
    const travel = caseW * 0.55;
    if (p < 0.12) setPose(ginger, 'sleep');
    else if (p < 0.22) setPose(ginger, 'stretch');
    else if (p < 0.5) {
      setPose(
        ginger,
        Math.floor((walk * travel) / (caseW * 0.045)) % 2 === 0 ? 'walk-a' : 'walk-b',
      );
    } else if (p < 0.585) setPose(ginger, 'bat');
    else setPose(ginger, 'sit');
    // A little bob while walking, so the two frames read as steps.
    const bob = p > 0.22 && p < 0.5 ? Math.abs(Math.sin(walk * travel * 0.12)) * caseH * 0.012 : 0;
    ginger.style.transform = `translate(${(walk * travel).toFixed(1)}px, ${(-bob).toFixed(1)}px)`;

    // Vase: tips, falls off the end, bounces twice and lies on its side.
    const tip = span(p, 0.515, 0.56);
    const fall = ramp(p, 0.56, 0.72);
    const drop = caseH * 0.985;
    let y: number;
    if (fall < 0.5) y = (fall / 0.5) ** 2 * drop;
    else if (fall < 0.8) {
      const u = (fall - 0.5) / 0.3;
      y = drop - 4 * u * (1 - u) * drop * 0.22;
    } else {
      const u = (fall - 0.8) / 0.2;
      y = drop - 4 * u * (1 - u) * drop * 0.07;
    }
    // Lying down, the vase's centre sits lower than when it stands.
    y += ((vase.offsetHeight - vase.offsetWidth) / 2) * clamp(fall * 1.4);
    const vx = -(tip * 0.02 + (1 - (1 - fall) ** 2) * 0.13) * caseW;
    vase.style.transform = `translate(${vx.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${(-(tip * 22 + fall * 70)).toFixed(1)}deg)`;

    // Yarn and kitten on the floor
    const roll = ramp(p, 0.45, 0.9);
    const out = span(p, 0.9, 1);
    const ballX = lerp(width + ballSize * 2, exitX, 1 - (1 - roll) ** 1.6);
    const ballY = out * (height - ball.offsetTop + ballSize);
    ball.style.transform = `translate(${(ballX - ballBase).toFixed(1)}px, ${ballY.toFixed(1)}px) rotate(${((ballX / (ballSize / 2)) * 57.3).toFixed(0)}deg)`;

    const kittenStop = kittenBase;
    const kittenX = Math.max(kittenStop, ballX + ballSize + kittenW * 0.25);
    const running = kittenX > kittenStop + 1 && roll > 0;
    if (running) {
      setPose(kitten, Math.floor(kittenX / (kittenW * 0.6)) % 2 === 0 ? 'run-a' : 'run-b');
    } else if (now > blinkAt) {
      // Sitting: blink now and then.
      setPose(kitten, kitten.dataset.pose === 'sit' ? 'blink' : 'sit');
      blinkAt = now + (kitten.dataset.pose === 'blink' ? 180 : 2400 + Math.random() * 3000);
    } else if (kitten.dataset.pose !== 'blink') {
      setPose(kitten, 'sit');
    }
    kitten.style.transform = `translateX(${(kittenX - kittenBase).toFixed(1)}px) scaleX(-1)`;

    // Thread from the right-hand wall to the ball
    let d = '';
    if (roll > 0) {
      const centre = ballX + ballSize / 2;
      d = `M${width + 20} ${ballLine.toFixed(1)}`;
      const bend = out > 0 ? Math.min(ballY, 44) : 0;
      for (let x = width - 20; x > centre + bend; x -= 46) {
        d += `L${x.toFixed(1)} ${(ballLine + Math.sin(x / 57) * 3.2).toFixed(1)}`;
      }
      // Round the corner where the thread turns to drop out of the room.
      d += `L${(centre + bend).toFixed(1)} ${ballLine.toFixed(1)}`;
      if (out > 0) {
        d += `Q${centre.toFixed(1)} ${ballLine.toFixed(1)} ${centre.toFixed(1)} ${(ballLine + bend).toFixed(1)}`;
        d += `L${centre.toFixed(1)} ${(ballLine + ballY).toFixed(1)}`;
      }
    }
    threads.forEach((thread) => thread.setAttribute('d', d));

    // Evening
    const skyTravel = sky.offsetHeight - (sky.parentElement?.clientHeight ?? 0);
    sky.style.transform = `translateY(${(-ramp(p, 0.02, 0.8) * skyTravel).toFixed(1)}px)`;
    const lamp = span(p, 0.6, 0.68);
    dusk.style.opacity = (span(p, 0.08, 0.6) * 0.62 * (1 - lamp)).toFixed(3);
    night.style.opacity = lamp.toFixed(3);
    glow.style.opacity = lamp.toFixed(3);
    if (hint) hint.style.opacity = (1 - span(p, 0.01, 0.06)).toFixed(2);
  };

  const reset = (): void => {
    [ginger, vase, kitten, ball, sky, dusk, night, glow].forEach((element) =>
      element.removeAttribute('style'),
    );
    hint?.removeAttribute('style');
    threads.forEach((thread) => thread.setAttribute('d', ''));
    setPose(ginger, 'sleep');
    setPose(kitten, 'sit');
  };

  measure();
  new ResizeObserver(measure).observe(stage);

  onFrame(({ now }) => {
    const range = section.offsetHeight - height;
    const p = range > 0 ? clamp(-section.getBoundingClientRect().top / range) : 0;
    // Nothing to redraw while the reader is not scrolling, except the sitting kitten's blink.
    if (p === last && now < blinkAt) return;
    last = p;
    draw(p, now);
  });

  onMotionChange(() => {
    if (!motionAllowed()) reset();
    last = -1;
  });
}
