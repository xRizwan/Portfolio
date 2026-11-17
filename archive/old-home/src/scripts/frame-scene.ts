import * as THREE from 'three';
import {
  blink,
  catFromObject,
  makeCuteCat,
  makeSprite,
  swayTail,
  toon,
  type CuteCat,
} from './cute-cats';
import { motionAllowed, onMotionChange, select } from './motion';

// The hero's framed portrait: a black frame that tilts toward the pointer, a calico napping on
// top, and a tuxedo kitten peeking from behind the left edge. The HTML fallback (a framed
// photo) stays visible until the scene has rendered, and returns if WebGL is lost.
const canvas = select('#workbench-canvas', HTMLCanvasElement);
const viewport = select('#room-viewport', HTMLElement);
const action = select('.scene-action', HTMLButtonElement);

if (canvas && viewport && action) {
  try {
    startScene(canvas, viewport, action);
  } catch {
    viewport.classList.add('use-fallback');
    viewport.classList.remove('is-ready');
  }
}

function roundedGeometry(
  width: number,
  height: number,
  depth: number,
  radius: number,
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize: 0.02,
    bevelThickness: 0.02,
    bevelSegments: 3,
    curveSegments: 8,
  });
  geometry.translate(0, 0, -depth / 2);
  return geometry;
}

function startScene(
  canvas: HTMLCanvasElement,
  viewport: HTMLElement,
  action: HTMLButtonElement,
): void {
  const pointer = new THREE.Vector2();
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  const target = new THREE.Vector3(0, 0.72, 0);
  scene.add(new THREE.HemisphereLight(0xe5efff, 0x28352a, 2.6));
  const key = new THREE.DirectionalLight(0xfff0dc, 4.5);
  key.position.set(-3, 6, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 0.5, far: 25 });
  key.shadow.normalBias = 0.03;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xc8f07a, 2.5);
  rim.position.set(5, 3, -4);
  scene.add(rim);

  const frame = new THREE.Group();
  scene.add(frame);
  const black = new THREE.MeshStandardMaterial({
    color: 0x131516,
    roughness: 0.32,
    metalness: 0.35,
  });
  const border = new THREE.Mesh(roundedGeometry(2.3, 3.5, 0.18, 0.05), black);
  border.castShadow = true;
  frame.add(border);

  // The portrait is drawn into a canvas texture, cropped to the frame's proportions.
  const photoCanvas = document.createElement('canvas');
  photoCanvas.width = 640;
  photoCanvas.height = 1006;
  const photoContext = photoCanvas.getContext('2d');
  const photoTexture = new THREE.CanvasTexture(photoCanvas);
  photoTexture.colorSpace = THREE.SRGBColorSpace;
  const photo = new THREE.Mesh(
    new THREE.PlaneGeometry(2.1, 3.3),
    new THREE.MeshBasicMaterial({ map: photoTexture, toneMapped: false }),
  );
  photo.position.z = 0.115;
  frame.add(photo);
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(2.1, 3.3),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.05,
      roughness: 0.05,
      metalness: 0.5,
    }),
  );
  glass.position.z = 0.12;
  frame.add(glass);
  const portrait = new Image();
  portrait.decoding = 'async';
  portrait.onload = () => {
    const sourceWidth = portrait.naturalWidth;
    const sourceHeight = Math.min(
      portrait.naturalHeight,
      (sourceWidth * photoCanvas.height) / photoCanvas.width,
    );
    const sourceY = Math.max(0, (portrait.naturalHeight - sourceHeight) * 0.5);
    photoContext?.drawImage(
      portrait,
      0,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      photoCanvas.width,
      photoCanvas.height,
    );
    photoTexture.needsUpdate = true;
    photoLoaded = true;
    if (compiled) {
      viewport.classList.add('is-ready');
      renderOnce();
    }
  };
  portrait.onerror = () => viewport.classList.remove('is-ready');
  portrait.src = viewport.dataset.portrait ?? '';

  // A calico loafing on the top edge, tail hanging down the right side.
  const napper = makeCuteCat({
    fur: 0xfbf3e6,
    patch: 0xe39a55,
    belly: 0xffffff,
    marks: 'calico',
    pose: 'loaf',
  });
  napper.root.position.set(0.62, 1.72, 0.02);
  napper.root.rotation.y = -0.25;
  napper.root.scale.setScalar(0.95);
  napper.tailRoot.position.set(0.44, 0.14, -0.05);
  napper.tailRoot.rotation.set(0, 0, Math.PI - 0.12);
  napper.lift = 0;
  napper.curl = 0.02;
  frame.add(napper.root);

  // A tuxedo kitten peeks from behind the left edge; its paws grip the frame.
  const peeker = makeCuteCat({
    fur: 0x3a3f45,
    patch: 0x24282c,
    belly: 0xf6f3ec,
    marks: 'tuxedo',
    pose: 'peek',
  });
  peeker.root.scale.setScalar(0.95);
  frame.add(peeker.root);
  const grips = [0.42, 0.02].map((y) => {
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 14), toon(0xf6f3ec));
    const hull = new THREE.Mesh(
      paw.geometry,
      new THREE.MeshBasicMaterial({ color: 0x1d1a17, side: THREE.BackSide }),
    );
    hull.scale.setScalar(1.3);
    paw.add(hull);
    paw.scale.set(0.8, 0.7, 0.9);
    paw.position.set(-1.14, y, 0.13);
    paw.userData.cat = peeker;
    frame.add(paw);
    return paw;
  });

  const cats: CuteCat[] = [napper, peeker];
  const hearts = cats.map((cat, index) => ({
    cat,
    sprite: makeSprite('♥', '#ff8fa3', 0.45),
    phase: index * 0.5,
  }));
  const snores = [0, 0.5].map((phase) => ({ sprite: makeSprite('z', '#e6ecff', 0.36), phase }));
  for (const { sprite } of [...hearts, ...snores]) scene.add(sprite);

  let greeting = false;
  let peek = 0;
  const headWorld = new THREE.Vector3();
  const spriteOpacity = (sprite: THREE.Sprite, value: number): void => {
    sprite.material.opacity = value;
  };

  function updateScene(elapsed: number, delta: number, moving: boolean): void {
    const next = greeting ? 1 : 0;
    for (const cat of cats) {
      cat.callBlend = moving ? THREE.MathUtils.lerp(cat.callBlend, next, 0.08) : next;
      cat.hop = Math.max(0, cat.hop - delta * 2.4);
      cat.cat.position.y = Math.sin(Math.min(1, cat.hop) * Math.PI) * 0.35;
    }
    const allowed = motionAllowed();
    frame.rotation.y = THREE.MathUtils.lerp(
      frame.rotation.y,
      (allowed ? pointer.x * 0.28 : 0) - 0.08,
      moving ? 0.06 : 1,
    );
    frame.rotation.x = THREE.MathUtils.lerp(
      frame.rotation.x,
      allowed ? pointer.y * 0.1 : 0,
      moving ? 0.06 : 1,
    );
    frame.position.y = moving ? Math.sin(elapsed * 0.9) * 0.06 : 0;

    // Peekaboo: out for a moment every few seconds, or when the pointer comes close.
    const cycle = elapsed % 6;
    const scheduled = cycle > 2.2 && cycle < 4.6 ? 1 : 0;
    const wanted = Math.max(scheduled, pointer.x < -0.35 ? 1 : 0, peeker.callBlend);
    peek = moving ? THREE.MathUtils.lerp(peek, wanted, 0.09) : 1;
    // Tucked fully behind the frame (and hidden) when not peeking, so nothing shows at the edge.
    peeker.root.position.set(
      THREE.MathUtils.lerp(-0.3, -1.42, peek) - peeker.callBlend * 0.12,
      0.05,
      -0.62,
    );
    peeker.root.visible = peek > 0.04;
    peeker.root.rotation.z = THREE.MathUtils.lerp(-0.1, 0.3, peek) - peeker.callBlend * 0.15;
    peeker.root.rotation.y = -0.3;
    grips.forEach((paw, index) => {
      const waving = index === 0 && peeker.callBlend > 0.5;
      paw.visible = peek > 0.55;
      paw.position.y =
        (index ? 0.02 : 0.42) + (waving && moving ? Math.abs(Math.sin(elapsed * 9)) * 0.35 : 0);
      paw.position.x = waving ? -1.26 : -1.14;
    });
    peeker.setMood(greeting ? 'happy' : 'open');
    blink(peeker, elapsed, 1.3);

    napper.setMood(greeting ? 'happy' : 'sleep');
    napper.head.position.y = THREE.MathUtils.lerp(0.5, 0.64, napper.callBlend);
    napper.head.rotation.x = THREE.MathUtils.lerp(0.2, -0.1, napper.callBlend);
    napper.body.scale.y = 1 + (moving ? Math.sin(elapsed * 1.7) * 0.035 : 0);
    swayTail(napper, elapsed, 1.4 + napper.callBlend * 2.5, moving ? 0.22 : 0);

    for (const { cat, sprite, phase } of hearts) {
      cat.head.getWorldPosition(headWorld);
      const rise = (elapsed * 0.5 + phase) % 1;
      sprite.position.set(
        headWorld.x + Math.sin(rise * 6) * 0.1,
        headWorld.y + 0.5 + rise * 0.8,
        headWorld.z + 0.2,
      );
      spriteOpacity(sprite, moving ? cat.callBlend * Math.sin(rise * Math.PI) : 0);
    }
    napper.head.getWorldPosition(headWorld);
    for (const { sprite, phase } of snores) {
      const rise = (elapsed * 0.35 + phase) % 1;
      sprite.position.set(
        headWorld.x + 0.25 + rise * 0.45,
        headWorld.y + 0.35 + rise * 0.7,
        headWorld.z + 0.2,
      );
      sprite.scale.setScalar(0.22 + rise * 0.22);
      spriteOpacity(sprite, (1 - napper.callBlend) * Math.sin(rise * Math.PI) * (moving ? 1 : 0.8));
    }
  }

  action.hidden = false;
  action.addEventListener('click', () => {
    greeting = !greeting;
    action.setAttribute('aria-pressed', String(greeting));
    action.textContent = greeting ? 'Let them nap' : 'Say hi';
    if (greeting) for (const cat of cats) cat.hop = 1;
    sync();
  });

  const raycaster = new THREE.Raycaster();
  const tap = new THREE.Vector2();
  const catAt = (event: PointerEvent): CuteCat | null => {
    const rect = viewport.getBoundingClientRect();
    tap.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(tap, camera);
    const hit = raycaster.intersectObjects([napper.root, peeker.root, ...grips], true)[0];
    return hit ? catFromObject(hit.object) : null;
  };
  viewport.addEventListener('pointerdown', (event) => {
    const cat = catAt(event);
    if (!cat) return;
    cat.hop = 1;
    sync();
  });
  viewport.addEventListener('pointermove', (event) => {
    const rect = viewport.getBoundingClientRect();
    if (event.pointerType === 'mouse' && motionAllowed()) {
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        ((event.clientY - rect.top) / rect.height) * 2 - 1,
      );
    }
    viewport.style.cursor = catAt(event) ? 'pointer' : '';
  });
  viewport.addEventListener('pointerleave', () => pointer.set(0, 0));

  let active = true;
  let frameRequest = 0;
  // Shaders compile off the main thread where the browser supports it; nothing is drawn (and
  // the HTML fallback stays visible) until they are ready.
  let compiled = false;
  let photoLoaded = false;
  let last = 0;
  let elapsed = 0;
  let distance = 9.9;
  function resize(): void {
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Desktop and tablet frame a little wider to fit the first screen; phones stay closer so
    // the portrait remains large. Narrow aspect ratios pull back to keep both cats in view.
    const fitted = width > 650;
    const base = fitted ? 9.9 : 8.7;
    target.y = fitted ? 0.72 : 0.85;
    distance = camera.aspect < 0.9 ? (base / Math.max(camera.aspect, 0.55)) * 0.9 : base;
    camera.updateProjectionMatrix();
    renderOnce();
  }
  function renderOnce(): void {
    if (!compiled) return;
    camera.position.set(0, 0.75, distance);
    camera.lookAt(target);
    renderer.render(scene, camera);
  }
  function animate(timestamp: number): void {
    frameRequest = 0;
    if (!active || document.hidden || !motionAllowed()) return;
    if (timestamp - last > 30) {
      const delta = Math.min(0.1, (timestamp - last) / 1000);
      elapsed += delta;
      last = timestamp;
      updateScene(elapsed, delta, true);
      renderOnce();
    }
    frameRequest = requestAnimationFrame(animate);
  }
  function sync(): void {
    if (frameRequest) cancelAnimationFrame(frameRequest);
    frameRequest = 0;
    if (!motionAllowed()) for (const cat of cats) cat.hop = 0;
    // Snap to the resting pose only when motion is off; otherwise keep the animation state.
    updateScene(elapsed, 0, motionAllowed());
    renderOnce();
    if (active && !document.hidden && motionAllowed()) {
      last = performance.now();
      frameRequest = requestAnimationFrame(animate);
    }
  }
  new ResizeObserver(resize).observe(viewport);
  new IntersectionObserver(([entry]) => {
    active = entry?.isIntersecting ?? true;
    sync();
  }).observe(viewport);
  document.addEventListener('visibilitychange', sync);
  onMotionChange(sync);
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    active = false;
    sync();
    viewport.classList.remove('is-ready');
  });
  canvas.addEventListener('webglcontextrestored', () => {
    active = true;
    viewport.classList.add('is-ready');
    sync();
  });
  const begin = (): void => {
    compiled = true;
    resize();
    sync();
    if (photoLoaded) viewport.classList.add('is-ready');
  };
  renderer.compileAsync(scene, camera).then(begin, begin);
}
