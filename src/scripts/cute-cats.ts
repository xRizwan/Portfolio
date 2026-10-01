import * as THREE from 'three';

// Chibi cats: oversized heads, glossy eyes, an "ω" mouth, three-tone toon shading, and
// inverted-hull outlines. Cats face +z. Shared by the frame scene and the title cats.

const tones = new Uint8Array([90, 90, 90, 255, 175, 175, 175, 255, 255, 255, 255, 255]);
const gradientMap = new THREE.DataTexture(tones, 3, 1, THREE.RGBAFormat);
gradientMap.minFilter = THREE.NearestFilter;
gradientMap.magFilter = THREE.NearestFilter;
gradientMap.needsUpdate = true;

export const toon = (color: number): THREE.MeshToonMaterial =>
  new THREE.MeshToonMaterial({ color, gradientMap });
const outlineMaterial = new THREE.MeshBasicMaterial({ color: 0x1d1a17, side: THREE.BackSide });
const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x191512 });
const shineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
const lineMaterial = new THREE.MeshBasicMaterial({ color: 0x2a1f19 });
const pinkMaterial = toon(0xf49aa6);
const blushMaterial = new THREE.MeshBasicMaterial({
  color: 0xff9aa8,
  transparent: true,
  opacity: 0.5,
  depthWrite: false,
});

export type Pose = 'sit' | 'walk' | 'loaf' | 'peek';
export type Mood = 'open' | 'sleep' | 'happy';

export interface CuteCat {
  root: THREE.Group;
  cat: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  tailRoot: THREE.Group;
  pose: Pose;
  legs: THREE.Object3D[];
  tail: THREE.Group[];
  eyes: { open: THREE.Group; sleepy: THREE.Group; happy: THREE.Group };
  mood: Mood;
  /** 1 at the start of a hop, decaying to 0. */
  hop: number;
  /** 0–1 blend toward the "called" pose. */
  callBlend: number;
  lift: number;
  curl: number;
  setMood(mood: Mood): void;
}

interface CatOptions {
  fur: number;
  patch: number;
  belly: number;
  marks?: 'tabby' | 'tuxedo' | 'calico';
  pose?: Pose;
}

function part(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  parent: THREE.Object3D,
  x = 0,
  y = 0,
  z = 0,
  outline = 0.045,
): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  parent.add(mesh);
  const position = geometry.getAttribute('position');
  if (outline && position instanceof THREE.BufferAttribute) {
    const hull = new THREE.Mesh(geometry, outlineMaterial);
    const size = new THREE.Box3().setFromBufferAttribute(position).getSize(new THREE.Vector3());
    const grow = (value: number): number => 1 + outline / Math.max(value, 0.05);
    hull.scale.set(grow(size.x), grow(size.y), grow(size.z));
    mesh.add(hull);
  }
  return mesh;
}
const ball = (radius: number): THREE.SphereGeometry => new THREE.SphereGeometry(radius, 32, 20);
function arc(radius: number, tube: number, flip: boolean): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 20, Math.PI), lineMaterial);
  if (flip) mesh.rotation.z = Math.PI;
  return mesh;
}

export function makeCuteCat({
  fur,
  patch,
  belly,
  marks = 'tabby',
  pose = 'sit',
}: CatOptions): CuteCat {
  const root = new THREE.Group();
  const cat = new THREE.Group();
  root.add(cat);
  const furMaterial = toon(fur);
  const patchMaterial = toon(patch);
  const bellyMaterial = toon(belly);
  const body = new THREE.Group();
  const head = new THREE.Group();
  const tailRoot = new THREE.Group();
  cat.add(body, head, tailRoot);

  // Head: wide, soft, and larger than the body.
  part(ball(0.46), furMaterial, head).scale.set(1.12, 0.94, 1);
  if (marks === 'tabby') {
    for (const x of [-0.11, 0, 0.11]) {
      const stripe = part(
        new THREE.CapsuleGeometry(0.028, 0.1, 4, 8),
        patchMaterial,
        head,
        x,
        0.34,
        0.26,
        0,
      );
      stripe.rotation.x = 0.5;
    }
  } else if (marks === 'tuxedo') {
    part(ball(0.21), bellyMaterial, head, 0, -0.15, 0.3, 0).scale.set(1.35, 0.8, 0.8);
  } else {
    part(ball(0.2), patchMaterial, head, -0.24, 0.24, 0.2, 0).scale.set(1, 0.8, 0.7);
    part(ball(0.13), toon(0x3b3431), head, 0.26, 0.28, 0.12, 0).scale.set(1, 0.8, 0.8);
  }
  for (const side of [-1, 1]) {
    const earMaterial = marks === 'calico' && side < 0 ? patchMaterial : furMaterial;
    const ear = part(
      new THREE.ConeGeometry(0.17, 0.3, 20),
      earMaterial,
      head,
      side * 0.28,
      0.38,
      -0.02,
      0.035,
    );
    ear.rotation.z = side * -0.38;
    const inner = part(
      new THREE.ConeGeometry(0.1, 0.18, 16),
      pinkMaterial,
      head,
      side * 0.28,
      0.36,
      0.06,
      0,
    );
    inner.rotation.z = side * -0.38;
    inner.scale.z = 0.5;
    const blush = new THREE.Mesh(new THREE.CircleGeometry(0.075, 20), blushMaterial);
    blush.position.set(side * 0.3, -0.1, 0.4);
    blush.rotation.y = side * 0.55;
    head.add(blush);
  }

  // Eyes: open (glossy), sleepy (closed arcs), and happy (^ ^).
  const open = new THREE.Group();
  const sleepy = new THREE.Group();
  const happy = new THREE.Group();
  head.add(open, sleepy, happy);
  for (const side of [-1, 1]) {
    const x = side * 0.19;
    const eye = new THREE.Mesh(ball(0.1), eyeMaterial);
    eye.position.set(x, 0, 0.41);
    eye.scale.set(0.85, 1.12, 0.45);
    const big = new THREE.Mesh(ball(0.036), shineMaterial);
    big.position.set(x - 0.03, 0.05, 0.46);
    const small = new THREE.Mesh(ball(0.016), shineMaterial);
    small.position.set(x + 0.035, -0.04, 0.46);
    open.add(eye, big, small);
    const closed = arc(0.07, 0.014, true);
    closed.position.set(x, 0.02, 0.44);
    sleepy.add(closed);
    const smile = arc(0.07, 0.016, false);
    smile.position.set(x, -0.01, 0.44);
    happy.add(smile);
  }
  part(ball(0.036), pinkMaterial, head, 0, -0.1, 0.45, 0).scale.set(1.3, 0.8, 0.8);
  for (const side of [-1, 1]) {
    const mouth = arc(0.042, 0.011, true);
    mouth.position.set(side * 0.042, -0.15, 0.44);
    head.add(mouth);
  }

  // Tail: a thick chain whose joints can sway and curl.
  const tail: THREE.Group[] = [];
  let joint: THREE.Group = tailRoot;
  for (let index = 0; index < 14; index += 1) {
    const segment = new THREE.Group();
    segment.position.set(0, index ? 0.048 : 0, 0);
    joint.add(segment);
    const striped = marks === 'tabby' && index % 4 >= 2;
    part(
      ball(0.074 - index * 0.0015),
      striped ? patchMaterial : furMaterial,
      segment,
      0,
      0,
      0,
      index % 2 ? 0 : 0.03,
    );
    tail.push(segment);
    joint = segment;
  }

  const legs: THREE.Object3D[] = [];
  const leg = (x: number, y: number, z: number, length = 0.1): void => {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, z);
    cat.add(pivot);
    part(
      new THREE.CapsuleGeometry(0.095, length, 4, 12),
      furMaterial,
      pivot,
      0,
      -length / 2 - 0.02,
      0,
      0.035,
    );
    part(ball(0.1), bellyMaterial, pivot, 0, -length - 0.06, 0.02, 0.03).scale.set(1.05, 0.7, 1.1);
    legs.push(pivot);
  };

  const torso = part(ball(0.36), furMaterial, body);
  if (marks !== 'calico') {
    part(ball(0.22), bellyMaterial, body, 0, -0.04, 0.2, 0).scale.set(1, 1.1, 0.7);
  } else {
    part(ball(0.2), patchMaterial, body, 0.12, 0.12, -0.1, 0).scale.set(1, 0.7, 1.1);
  }

  let lift = 0.16;
  let curl = 0;
  if (pose === 'sit') {
    body.position.set(0, 0.36, -0.02);
    torso.scale.set(1, 1.05, 0.95);
    head.position.set(0, 0.95, 0.06);
    leg(-0.13, 0.28, 0.22, 0.08);
    leg(0.13, 0.28, 0.22, 0.08);
    for (const side of [-1, 1]) {
      part(ball(0.19), furMaterial, cat, side * 0.23, 0.18, -0.06, 0.035).scale.set(0.9, 0.85, 1.2);
    }
    tailRoot.position.set(0.18, 0.12, -0.33);
    tailRoot.rotation.set(-1.3, 0, -0.9);
    lift = 0.22;
    curl = 0.05;
  } else if (pose === 'walk') {
    body.position.set(0, 0.42, -0.08);
    torso.scale.set(0.95, 0.85, 1.25);
    head.position.set(0, 0.82, 0.36);
    for (const [x, z] of [
      [-0.17, 0.2],
      [0.17, 0.2],
      [-0.17, -0.3],
      [0.17, -0.3],
    ] as const)
      leg(x, 0.3, z, 0.1);
    tailRoot.position.set(0, 0.5, -0.48);
    tailRoot.rotation.x = -0.9;
    lift = 0.1;
  } else if (pose === 'loaf') {
    body.position.set(0, 0.26, -0.12);
    torso.scale.set(1.15, 0.72, 1.3);
    head.position.set(0, 0.5, 0.3);
    head.scale.setScalar(0.92);
    for (const side of [-1, 1]) {
      part(ball(0.1), bellyMaterial, cat, side * 0.14, 0.07, 0.44, 0.03).scale.set(1, 0.6, 1.3);
    }
    tailRoot.position.set(0.3, 0.1, -0.5);
    tailRoot.rotation.set(-1.55, 0, 0);
    lift = 0;
    curl = 0.32;
  } else {
    body.visible = false;
    head.position.set(0, 0.5, 0);
    tailRoot.visible = false;
  }

  const parts: CuteCat = {
    root,
    cat,
    body,
    head,
    tailRoot,
    pose,
    legs,
    tail,
    eyes: { open, sleepy, happy },
    mood: 'open',
    hop: 0,
    callBlend: 0,
    lift,
    curl,
    setMood(mood) {
      parts.mood = mood;
      open.visible = mood === 'open';
      sleepy.visible = mood === 'sleep';
      happy.visible = mood === 'happy';
    },
  };
  parts.setMood(pose === 'loaf' ? 'sleep' : 'open');
  root.traverse((child) => {
    child.userData.cat = parts;
  });
  return parts;
}

/** Reads the cat stored on a hit object by makeCuteCat. */
export function catFromObject(object: THREE.Object3D): CuteCat | null {
  const value: unknown = object.userData.cat;
  return value && typeof value === 'object' && 'root' in value ? (value as CuteCat) : null;
}

export function swayTail(cat: CuteCat, time: number, speed: number, amount: number): void {
  cat.tail.forEach((segment, index) => {
    if (!index) return;
    const weight = index / cat.tail.length;
    segment.rotation.x = cat.lift * 0.62 + Math.sin(time * speed - index * 0.55) * amount * weight;
    segment.rotation.z =
      cat.curl * 0.62 + Math.cos(time * speed * 0.8 - index * 0.5) * amount * 0.7 * weight;
  });
}

export function blink(cat: CuteCat, time: number, offset = 0): void {
  if (cat.mood !== 'open') return;
  const closed = Math.sin(time * 1.15 + offset) > 0.975;
  cat.eyes.open.scale.y = closed ? 0.12 : 1;
}

/** Floating hearts and sleepy Zs, drawn as small canvas sprites. */
export function makeSprite(text: string, color: string, size = 0.42): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  if (context) {
    context.font = '700 96px "Segoe UI Symbol", "Apple Color Emoji", sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.lineWidth = 10;
    context.strokeStyle = '#1d1a17';
    context.strokeText(text, 64, 70);
    context.fillStyle = color;
    context.fillText(text, 64, 70);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, opacity: 0 }),
  );
  sprite.scale.setScalar(size);
  return sprite;
}
