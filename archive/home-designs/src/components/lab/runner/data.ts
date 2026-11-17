// One level for the whole page, sized from the real content so every skill group, role, project
// and certificate has its own spot along the way.
import { credentials } from '../../../data/certificates';
import { experienceIntro, roles } from '../../../data/experience';
import { skillGroups } from '../../../data/skills';
import { workRows } from '../../../data/work';
import { buildLevel, GROUND } from './level';
import { poseAt, surfaceAt } from './path';

export const level = buildLevel({
  traits: experienceIntro.about.traits.length,
  skills: skillGroups.length,
  roles: roles.length,
  work: workRows.length,
  certificates: credentials.length,
});

/**
 * How long the title card stays in play. Its lettering fades within the first few steps, but
 * the billboard with the portrait stands in the world until it has scrolled off a wide screen.
 */
export const TITLE_END = 1850;

/** Height above the bottom of the stage of something resting on the surface at `x`. */
export const restingAt = (x: number): number => GROUND + surfaceAt(level.terrain, x);

/** Treats hang along the hero's path: on a jump they follow the arc, elsewhere the surface. */
export const treats = level.treats.map((treat) => {
  const pose = poseAt(level.jumps, level.terrain, treat.x);
  const jump = level.jumps.find((j) => treat.x > j.from && treat.x < j.to);
  // On an arc the treat's own height already includes the curve; add only the change in ground.
  const base = jump
    ? surfaceAt(level.terrain, jump.from) +
      ((surfaceAt(level.terrain, jump.to) - surfaceAt(level.terrain, jump.from)) *
        (treat.x - jump.from)) /
        (jump.to - jump.from)
    : pose.y;
  return { x: treat.x, bottom: Math.round(GROUND + base + treat.y) };
});
