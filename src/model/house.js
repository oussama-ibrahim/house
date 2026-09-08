import { CUTAWAY_WALL_HEIGHT, WALL_HEIGHT, WORLD_PLACEMENT } from '../spec/global.js';
import { DEFAULT_DESIGN, designById } from '../spec/designs.js';
import { buildLevel } from './level.js';

/** The level specs of a design, ground first. */
export function levelSpecs(design = DEFAULT_DESIGN) {
  return designById(design).levels;
}

/** Both levels of a design, built for the requested render mode, with their world offsets. */
export function buildHouse({ cutaway = true, design = DEFAULT_DESIGN } = {}) {
  const wallHeight = cutaway ? CUTAWAY_WALL_HEIGHT : WALL_HEIGHT;
  return {
    design,
    cutaway,
    wallHeight,
    levels: levelSpecs(design).map((spec) => ({
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
