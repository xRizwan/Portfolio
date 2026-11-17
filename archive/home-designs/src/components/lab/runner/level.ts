// The level, authored along its length. Distances are in level units: the pinned stage is drawn
// at a fixed unit size and scaled to the screen, so one layout serves desktop and phone. The page
// builds the world's markup from this at build time and hands the same numbers to the engine as
// JSON, so the drawing and the hero's path cannot drift apart.

/** Where the hero stands before any scrolling. */
export const START = 150;
/** Height of the walking surface above the bottom of the pinned stage. */
export const GROUND = 118;

export type Theme = 'meadow' | 'sky' | 'sunset' | 'cave';
export type StageId = 'about' | 'skills' | 'experience' | 'work' | 'certificates' | 'contact';

export interface Stage {
  id: StageId;
  /** Stage name shown in the corner and on the stage's first card. */
  name: string;
  theme: Theme;
  from: number;
  to: number;
}

/** A smooth arc between two points on the ground, driven by position so it also plays backwards. */
export interface Jump {
  from: number;
  to: number;
  height: number;
  kind: 'gap' | 'hop' | 'step' | 'spring';
}

/** A stretch where the walking surface is not the plain ground. */
export interface Terrain {
  from: number;
  to: number;
  y0: number;
  y1: number;
  /** Extra rise in the middle (the bridge's arch). */
  arch?: number;
  kind: 'ledge' | 'ramp' | 'ride' | 'bridge';
}

export interface Span {
  from: number;
  to: number;
}

export interface Treat {
  x: number;
  y: number;
}

/** A stretch of scroll during which one content card is held on screen. */
export interface Hold {
  from: number;
  to: number;
}

export interface Level {
  length: number;
  stages: Stage[];
  jumps: Jump[];
  terrain: Terrain[];
  /** Ground strips per theme; gaps between them are pits, streams and stage changes. */
  ground: (Span & { theme: Theme })[];
  treats: Treat[];
  /** Doorways: the screen irises shut on the way in and opens on the far side. */
  doors: number[];
  about: { intro: Hold; traits: Hold[]; bridge: Span; ledge: Span; spring: number };
  skills: { intro: Hold; cloud: Span; ramp: Span; blocks: (Hold & { x: number })[] };
  experience: { intro: Hold; log: number; ride: Span; flags: (Hold & { x: number })[] };
  work: { intro: Hold; chests: (Hold & { x: number })[]; blog: Hold & { x: number } };
  certificates: { intro: Hold; frames: (Hold & { x: number })[] };
  contact: { card: Hold; pole: number; castle: number };
}

interface Counts {
  traits: number;
  skills: number;
  roles: number;
  work: number;
  certificates: number;
}

const BLOCK_GAP = 360;
const FLAG_GAP = 1060;
const CHEST_GAP = 580;
const FRAME_GAP = 250;

/** Height of the bottom of an item block above the ground the hero is standing on. */
export const BLOCK_Y = 190;
/** Hop that brings the hero's head up to the block. */
const HOP = 72;

export function buildLevel(counts: Counts): Level {
  const jumps: Jump[] = [];
  const terrain: Terrain[] = [];
  const treats: Treat[] = [];
  const gaps: Span[] = [];

  const arcTreats = (jump: Jump, lift = 62) => {
    for (const t of [0.28, 0.5, 0.72]) {
      treats.push({
        x: Math.round(jump.from + (jump.to - jump.from) * t),
        y: Math.round(4 * jump.height * t * (1 - t) + lift),
      });
    }
  };
  const rowTreats = (x: number, count = 3, y = 48) => {
    for (let i = 0; i < count; i++) treats.push({ x: x + i * 46, y });
  };
  const gapJump = (from: number, to: number, height = 78) => {
    const jump: Jump = { from, to, height, kind: 'gap' };
    jumps.push(jump);
    gaps.push({ from: from + 25, to: to - 25 });
    arcTreats(jump);
  };

  // --- Meadow: about ------------------------------------------------------------------------
  const aboutIntro: Hold = { from: 520, to: 1240 };
  const bridge: Span = { from: 1290, to: 1490 };
  terrain.push({
    from: bridge.from + 10,
    to: bridge.to - 10,
    y0: 0,
    y1: 0,
    arch: 30,
    kind: 'bridge',
  });
  gaps.push({ from: bridge.from + 34, to: bridge.to - 34 });
  rowTreats(1150);

  // The traits: one on the near bank, one past a pit, one up on a ledge.
  const traitHolds: Hold[] = [];
  let x = 1540;
  traitHolds.push({ from: x, to: x + 410 });
  gapJump(1975, 2125);
  x = 2150;
  traitHolds.push({ from: x, to: x + 410 });
  const ledge: Span = { from: 2640, to: 3060 };
  const LEDGE_Y = 60;
  terrain.push({ from: ledge.from, to: ledge.to, y0: LEDGE_Y, y1: LEDGE_Y, kind: 'ledge' });
  jumps.push({ from: 2590, to: 2670, height: 46, kind: 'step' });
  traitHolds.push({ from: 2680, to: 3030 });
  // Any further traits (the data has three) would simply share the ledge.
  for (let i = 3; i < counts.traits; i++) traitHolds.push({ from: 2680, to: 3030 });

  // A spring on the end of the ledge throws the hero up into the next stage.
  const spring = 3040;
  const CLOUD_Y = 56;
  const cloud: Span = { from: 3270, to: 3470 };
  const springJump: Jump = { from: spring, to: 3300, height: 210, kind: 'spring' };
  jumps.push(springJump);
  arcTreats(springJump);
  terrain.push({ from: cloud.from, to: cloud.to, y0: CLOUD_Y, y1: CLOUD_Y, kind: 'ledge' });
  const ramp: Span = { from: cloud.to, to: cloud.to + 150 };
  terrain.push({ from: ramp.from, to: ramp.to, y0: CLOUD_Y, y1: 0, kind: 'ramp' });
  const meadowEnd = ledge.to + 20;
  const skyStart = ramp.from - 10;

  // --- Sky: skills --------------------------------------------------------------------------
  const skillsIntro: Hold = { from: 3310, to: 3620 };
  const firstBlock = 3700;
  const blocks = Array.from({ length: counts.skills }, (_, i) => {
    const bx = firstBlock + i * BLOCK_GAP;
    jumps.push({ from: bx - 62, to: bx + 62, height: HOP, kind: 'hop' });
    return { x: bx, from: bx, to: bx + BLOCK_GAP - 70 };
  });
  const skillsEnd = firstBlock + counts.skills * BLOCK_GAP - 60;
  gapJump(skillsEnd + 15, skillsEnd + 165, 82);
  const sunsetStart = skillsEnd + 90;

  // --- Sunset: experience -------------------------------------------------------------------
  x = skillsEnd + 190;
  const experienceIntro: Hold = { from: x, to: x + 290 };
  const log = x + 400;
  const firstFlag = x + 570;
  let ride: Span = { from: 0, to: 0 };
  const flags = Array.from({ length: counts.roles }, (_, i) => {
    const fx = firstFlag + i * FLAG_GAP;
    const end = fx + 570;
    if (i < counts.roles - 1) {
      if (i === 0) {
        // A plank ferries the hero over the first canyon; the others are plain jumps.
        ride = { from: end + 55, to: end + 385 };
        terrain.push({ from: ride.from, to: ride.to, y0: 8, y1: 8, kind: 'ride' });
        gaps.push({ from: ride.from + 15, to: ride.to - 15 });
        rowTreats(ride.from + 120, 3, 70);
      } else {
        gapJump(end + 95, end + 245);
      }
    }
    return { x: fx, from: fx - 30, to: end };
  });
  const lastFlag = flags[flags.length - 1];
  const caveDoor = (lastFlag?.to ?? x) + 170;

  // --- Cave: work, then certificates --------------------------------------------------------
  x = caveDoor + 140;
  const workIntro: Hold = { from: x, to: x + 280 };
  const firstChest = x + 370;
  const chests = Array.from({ length: counts.work }, (_, i) => {
    const cx = firstChest + i * CHEST_GAP;
    return { x: cx, from: cx - 30, to: cx + CHEST_GAP - 60 };
  });
  x = firstChest + counts.work * CHEST_GAP;
  const blog = { x: x + 30, from: x, to: x + 320 };
  rowTreats(x + 360);
  x += 480;
  const certificatesStart = x - 40;
  const certificatesIntro: Hold = { from: x, to: x + 280 };
  const firstFrame = x + 360;
  const frames = Array.from({ length: counts.certificates }, (_, i) => {
    const fx = firstFrame + i * FRAME_GAP;
    if (i % 3 === 1) treats.push({ x: fx + 190, y: 44 });
    return { x: fx, from: fx - 20, to: fx + FRAME_GAP - 30 };
  });
  x = firstFrame + counts.certificates * FRAME_GAP;
  const exitDoor = x + 150;

  // --- Morning meadow: contact --------------------------------------------------------------
  const contactCard: Hold = { from: exitDoor + 190, to: exitDoor + 560 };
  rowTreats(exitDoor + 130, 4);
  const length = exitDoor + 540;
  const pole = length + 90;
  const castle = length + 290;

  // Ground strips: each theme's run with the gaps cut out.
  const runs: (Span & { theme: Theme })[] = [
    { theme: 'meadow', from: -2400, to: meadowEnd },
    { theme: 'sky', from: skyStart, to: sunsetStart - 50 },
    { theme: 'sunset', from: sunsetStart - 50, to: caveDoor },
    { theme: 'cave', from: caveDoor, to: exitDoor },
    { theme: 'meadow', from: exitDoor, to: length + 2600 },
  ];
  const ground = runs.flatMap((run) => {
    const pieces: (Span & { theme: Theme })[] = [];
    let from = run.from;
    for (const gap of [...gaps].sort((a, b) => a.from - b.from)) {
      if (gap.to <= run.from || gap.from >= run.to) continue;
      if (gap.from > from) pieces.push({ theme: run.theme, from, to: gap.from });
      from = Math.max(from, gap.to);
    }
    if (from < run.to) pieces.push({ theme: run.theme, from, to: run.to });
    return pieces;
  });

  const stages: Stage[] = [
    { id: 'about', name: 'Home meadow', theme: 'meadow', from: 0, to: 3160 },
    { id: 'skills', name: 'Block hills', theme: 'sky', from: 3160, to: sunsetStart },
    { id: 'experience', name: 'Sunset trail', theme: 'sunset', from: sunsetStart, to: caveDoor },
    { id: 'work', name: 'Treasure cave', theme: 'cave', from: caveDoor, to: certificatesStart },
    {
      id: 'certificates',
      name: 'Lantern gallery',
      theme: 'cave',
      from: certificatesStart,
      to: exitDoor,
    },
    { id: 'contact', name: 'The finish', theme: 'meadow', from: exitDoor, to: length + 1 },
  ];

  return {
    length,
    stages,
    jumps: jumps.sort((a, b) => a.from - b.from),
    terrain: terrain.sort((a, b) => a.from - b.from),
    ground,
    treats: treats.sort((a, b) => a.x - b.x),
    doors: [caveDoor, exitDoor],
    about: { intro: aboutIntro, traits: traitHolds, bridge, ledge, spring },
    skills: { intro: skillsIntro, cloud, ramp, blocks },
    experience: { intro: experienceIntro, log, ride, flags },
    work: { intro: workIntro, chests, blog },
    certificates: { intro: certificatesIntro, frames },
    contact: { card: contactCard, pole, castle },
  };
}

/** The numbers the engine needs in the browser. */
export interface LevelData {
  start: number;
  ground: number;
  length: number;
  stages: Stage[];
  jumps: Jump[];
  terrain: Terrain[];
  doors: number[];
  ride: Span;
  pole: number;
}

export function levelData(level: Level): LevelData {
  return {
    start: START,
    ground: GROUND,
    length: level.length,
    stages: level.stages,
    jumps: level.jumps,
    terrain: level.terrain,
    doors: level.doors,
    ride: level.experience.ride,
    pole: level.contact.pole,
  };
}
