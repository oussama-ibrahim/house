// Where the levels and the roof stand in the world for each layout and design.
import { FLOOR_TO_FLOOR, WORLD_PLACEMENT } from '../spec/global.js';
import { DEFAULT_DESIGN } from '../spec/designs.js';
import { ASSEMBLED_ORIGIN, LAYOUTS, ROOF } from '../spec/presentation.js';
import { levelSpecs } from './house.js';
import { roofPlacement } from './roof.js';

function assertLayout(layout) {
  if (!LAYOUTS.includes(layout)) throw new Error(`Unknown layout "${layout}"`);
}

function topLevel(design) {
  const specs = levelSpecs(design);
  return specs[specs.length - 1];
}

/** The roof covers the top level, so it takes that level's size. */
export function roofSize(design = DEFAULT_DESIGN) {
  return topLevel(design).size;
}

/** World position of a level group: side by side, or stacked one floor-to-floor height per storey. */
export function levelPlacement(layout, levelId, design = DEFAULT_DESIGN) {
  assertLayout(layout);
  if (layout === 'exploded') return [...WORLD_PLACEMENT[levelId]];
  const storey = levelSpecs(design).findIndex((spec) => spec.id === levelId);
  if (storey < 0) throw new Error(`No level ${levelId}`);
  return [ASSEMBLED_ORIGIN[0], ASSEMBLED_ORIGIN[1] + storey * FLOOR_TO_FLOOR, ASSEMBLED_ORIGIN[2]];
}

/**
 * World position of the roof group's reference point. Lifted off beside the exploded levels, or
 * lowered by its lift so the slab seats on the top storey's walls when the house is assembled.
 */
export function roofPosition(layout, design = DEFAULT_DESIGN) {
  assertLayout(layout);
  const size = roofSize(design);
  if (layout === 'exploded') return roofPlacement(levelPlacement('exploded', ROOF.anchorLevel, design), size);
  const top = levelPlacement('assembled', topLevel(design).id, design);
  return [top[0] + size[0] / 2, top[1] - ROOF.lift, top[2] + size[1] / 2];
}
