import * as THREE from 'three';
import { blink, catFromObject, makeCuteCat, swayTail, type CuteCat } from './cute-cats';
import { motionAllowed, onMotionChange, select } from './motion';

// 3D chibi cats on the RIZZY letters: a ginger tabby paces the cap line, and a grey cat naps on
// the Y and wakes when the tabby (or the pointer) visits. The tabby chases the ball of yarn
// while the visitor plays with it. If WebGL is unavailable, the flat SVG cat is used instead.
const title = select('.current-title', HTMLElement);
const text = title ? select('.charged-text', HTMLElement, title) : null;

if (title && text) {
  try {
    startTitleCats(title, text);
    document.body.classList.add('title-cats-ready');
  } catch {
    document.body.classList.remove('title-cats-ready');
  }
}

function startTitleCats(title: HTMLElement, text: HTMLElement): void {
  const small = matchMedia('(max-width: 650px)');
  const canvas = document.createElement('canvas');
  canvas.className = 'title-cats-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  title.append(canvas);
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(0, 1, 0, -1, -2000, 2000);
  scene.add(new THREE.HemisphereLight(0xf2f6ff, 0x3a4630, 2.6));
  const key = new THREE.DirectionalLight(0xfff0dc, 3.2);
  key.position.set(-2, 4, 6);
  scene.add(key);

  const walker = makeCuteCat({
    fur: 0xe8833a,
    patch: 0xb0541c,
    belly: 0xfff1de,
    marks: 'tabby',
    pose: 'walk',
  });
  const napper = makeCuteCat({
    fur: 0x98a2ae,
    patch: 0x6d7682,
    belly: 0xf3f4f6,
    marks: 'tuxedo',
    pose: 'loaf',
  });
  scene.add(walker.root, napper.root);
  walker.root.rotation.x = 0.16;
  napper.root.rotation.set(0.2, -0.35, 0);

  const layout = { unit: 20, ground: 0, min: 0, max: 0, napX: 0, width: 1, height: 1 };
  const state = {
    x: 0,
    direction: 1,
    target: 0,
    pauseUntil: 0,
    turn: 1,
    wakeUntil: 0,
    hop: 0,
    chaseUntil: 0,
    chaseX: 0,
    batCooldown: 0,
  };

  function measure(): void {
    const titleBox = title.getBoundingClientRect();
    const textBox = text.getBoundingClientRect();
    const font = parseFloat(getComputedStyle(text).fontSize);
    const capTop = textBox.top - titleBox.top + font * (small.matches ? 0.12 : 0.115);
    const unit = Math.max(font * 0.21, 26);
    const above = unit * 2.2;
    layout.width = titleBox.width;
    layout.height = above + unit * 0.2;
    layout.unit = unit;
    layout.ground = -above;
    const left = textBox.left - titleBox.left;
    const right = textBox.right - titleBox.left - font * 0.09;
    layout.napX = right - unit * 0.52;
    layout.min = left + unit * 0.7;
    layout.max = layout.napX - unit * 1.75;
    canvas.style.top = `${capTop - above}px`;
    canvas.style.width = `${layout.width}px`;
    canvas.style.height = `${layout.height}px`;
    renderer.setSize(layout.width, layout.height, false);
    camera.left = 0;
    camera.right = layout.width;
    camera.top = 0;
    camera.bottom = -layout.height;
    camera.updateProjectionMatrix();
    walker.root.scale.setScalar(unit);
    napper.root.scale.setScalar(unit * 1.05);
    napper.root.position.set(layout.napX, layout.ground - unit * 0.02, 0);
    state.x = Math.min(
      Math.max(state.x || layout.min + (layout.max - layout.min) * 0.35, layout.min),
      layout.max,
    );
    if (!state.target) state.target = layout.max;
  }

  let elapsed = 0;
  function update(delta: number, moving: boolean): void {
    const now = performance.now();
    const chasing = now < state.chaseUntil;
    if (chasing) {
      state.target = Math.min(Math.max(state.chaseX, layout.min), layout.max);
      state.pauseUntil = 0;
    }
    if (moving && now > state.pauseUntil) {
      const speed = layout.unit * (chasing ? 3.2 : 1.25);
      const distance = state.target - state.x;
      if (Math.abs(distance) <= speed * delta) {
        state.x = state.target;
        if (chasing) {
          state.direction = Math.sign(distance) || state.direction;
        } else {
          state.pauseUntil = now + 900 + Math.random() * 1800;
          const atEnd = state.target >= layout.max - 1;
          if (atEnd) state.wakeUntil = now + 2300;
          state.target = atEnd
            ? layout.min + Math.random() * (layout.max - layout.min) * 0.4
            : layout.max;
          state.direction = Math.sign(state.target - state.x) || 1;
        }
      } else {
        state.x += Math.sign(distance) * speed * delta;
        state.direction = Math.sign(distance);
      }
    }
    pose(delta, moving, now);
  }

  function pose(delta: number, moving: boolean, now: number): void {
    const walking = moving && now > state.pauseUntil && Math.abs(state.target - state.x) > 1;
    state.turn = moving ? THREE.MathUtils.lerp(state.turn, state.direction, 0.12) : state.direction;
    state.hop = Math.max(0, state.hop - delta * 2.4);
    walker.root.position.set(
      state.x,
      layout.ground + Math.sin(Math.min(1, state.hop) * Math.PI) * layout.unit * 0.6,
      0,
    );
    walker.root.rotation.y = (state.turn * Math.PI) / 2;
    // While walking the head turns toward the viewer; when paused it turns further.
    walker.head.rotation.y = -state.turn * (walking ? 0.85 : 1.35);
    const stride = walking ? Math.sin(elapsed * 10) * 0.6 : 0;
    walker.legs.forEach((pivot, index) => {
      pivot.rotation.x = index === 0 || index === 3 ? stride : -stride;
    });
    walker.body.position.y = 0.42 + (walking ? Math.abs(Math.sin(elapsed * 10)) * 0.035 : 0);
    swayTail(walker, elapsed, walking ? 3.2 : 2, moving ? 0.35 : 0);
    blink(walker, elapsed, 0.5);

    const awake = now < state.wakeUntil;
    napper.setMood(awake ? 'happy' : 'sleep');
    napper.callBlend = moving ? THREE.MathUtils.lerp(napper.callBlend, awake ? 1 : 0, 0.1) : 0;
    napper.head.position.y = THREE.MathUtils.lerp(0.5, 0.64, napper.callBlend);
    napper.head.rotation.x = THREE.MathUtils.lerp(0.2, -0.1, napper.callBlend);
    napper.body.scale.y = 1 + (moving ? Math.sin(elapsed * 1.7) * 0.035 : 0);
    swayTail(
      napper,
      elapsed + 1,
      1 + napper.callBlend * 2.5,
      moving ? 0.15 + napper.callBlend * 0.2 : 0,
    );
  }
  // Shaders compile off the main thread where supported; drawing starts once they are ready.
  let compiled = false;
  const render = (): void => {
    if (compiled) renderer.render(scene, camera);
  };

  // Hovering the napper wakes it; a click makes either cat react.
  const raycaster = new THREE.Raycaster();
  const probe = new THREE.Vector2();
  const hitCat = (event: PointerEvent): CuteCat | null => {
    const box = canvas.getBoundingClientRect();
    if (
      event.clientX < box.left ||
      event.clientX > box.right ||
      event.clientY < box.top ||
      event.clientY > box.bottom
    ) {
      return null;
    }
    probe.set(
      ((event.clientX - box.left) / box.width) * 2 - 1,
      -((event.clientY - box.top) / box.height) * 2 + 1,
    );
    raycaster.setFromCamera(probe, camera);
    const hit = raycaster.intersectObjects([walker.root, napper.root], true)[0];
    return hit ? catFromObject(hit.object) : null;
  };
  addEventListener('pointermove', (event) => {
    const cat = hitCat(event);
    // The cursor is set on the text: toggling body classes would re-sync every scene.
    text.style.cursor = cat ? 'pointer' : '';
    if (cat === napper) state.wakeUntil = performance.now() + 1600;
  });
  addEventListener('pointerdown', (event) => {
    const cat = hitCat(event);
    if (cat === walker) state.hop = 1;
    if (cat === napper) state.wakeUntil = performance.now() + 2200;
  });

  // Chase the yarn while the visitor is playing with it over the letters.
  addEventListener('yarn-ball', (event) => {
    if (!motionAllowed() || !event.detail.active) return;
    const box = canvas.getBoundingClientRect();
    const { x, y } = event.detail;
    const groundY = box.top - layout.ground;
    const unit = layout.unit;
    if (
      x < box.left - unit ||
      x > box.right + unit ||
      y < groundY - unit * 6 ||
      y > groundY + unit * 7
    )
      return;
    const now = performance.now();
    state.chaseX = x - box.left;
    state.chaseUntil = now + 450;
    const catY = groundY - unit * 0.8;
    if (Math.hypot(x - (box.left + state.x), y - catY) < unit * 1.6 && now > state.batCooldown) {
      state.hop = 1;
      state.batCooldown = now + 900;
    }
    if (Math.hypot(x - (box.left + layout.napX), y - catY) < unit * 2.2)
      state.wakeUntil = now + 1500;
  });

  let active = true;
  let frame = 0;
  let last = 0;
  function animate(timestamp: number): void {
    frame = 0;
    if (!active || document.hidden || !motionAllowed()) return;
    const delta = Math.min(0.05, (timestamp - last) / 1000 || 0);
    last = timestamp;
    elapsed += delta;
    update(delta, true);
    render();
    frame = requestAnimationFrame(animate);
  }
  function sync(): void {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    measure();
    if (!motionAllowed()) {
      state.x = layout.min + (layout.max - layout.min) * 0.45;
      state.direction = 1;
      state.hop = 0;
      state.wakeUntil = 0;
    }
    update(0, motionAllowed());
    render();
    if (active && !document.hidden && motionAllowed()) {
      last = performance.now();
      frame = requestAnimationFrame(animate);
    }
  }
  new ResizeObserver(sync).observe(title);
  new IntersectionObserver(([entry]) => {
    active = entry?.isIntersecting ?? true;
    sync();
  }).observe(title);
  document.addEventListener('visibilitychange', sync);
  onMotionChange(sync);
  small.addEventListener('change', sync);
  void document.fonts.ready.then(sync);
  const begin = (): void => {
    compiled = true;
    sync();
  };
  renderer.compileAsync(scene, camera).then(begin, begin);
}
