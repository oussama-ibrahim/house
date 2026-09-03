import { CUTAWAY_WALL_HEIGHT, WALL_HEIGHT, WORLD_PLACEMENT } from '../spec/global.js';
import { FIRST } from '../spec/first.js';
import { GROUND } from '../spec/ground.js';
import { buildLevel } from './level.js';

export const LEVEL_SPECS = Object.freeze([GROUND, FIRST]);

/** Both levels, built for the requested render mode, with their world offsets. */
export function buildHouse({ cutaway = true } = {}) {
  const wallHeight = cutaway ? CUTAWAY_WALL_HEIGHT : WALL_HEIGHT;
  return {
    cutaway,
    wallHeight,
    levels: LEVEL_SPECS.map((spec) => ({
      spec,
      model: buildLevel(spec, { wallHeight }),
      offset: WORLD_PLACEMENT[spec.id],
    })),
  };
}

export function levelById(house, id) {
  const entry = house.levels.find((candidate) => candidate.spec.id === id);
  if (!entry) throw new Error(`No level ${id}`);
  return entry;
}
