// Where the levels and the roof stand in the world for each layout.
import { FLOOR_TO_FLOOR, WORLD_PLACEMENT } from '../spec/global.js';
import { ASSEMBLED_ORIGIN, LAYOUTS, ROOF } from '../spec/presentation.js';
import { LEVEL_SPECS } from './house.js';
import { roofPlacement } from './roof.js';

function assertLayout(layout) {
  if (!LAYOUTS.includes(layout)) throw new Error(`Unknown layout "${layout}"`);
}

/** World position of a level group: side by side, or stacked one floor-to-floor height per storey. */
export function levelPlacement(layout, levelId) {
  assertLayout(layout);
  if (layout === 'exploded') return [...WORLD_PLACEMENT[levelId]];
  const storey = LEVEL_SPECS.findIndex((spec) => spec.id === levelId);
  if (storey < 0) throw new Error(`No level ${levelId}`);
  return [ASSEMBLED_ORIGIN[0], ASSEMBLED_ORIGIN[1] + storey * FLOOR_TO_FLOOR, ASSEMBLED_ORIGIN[2]];
}

/**
 * World position of the roof group's reference point. Lifted off beside the exploded levels, or
 * lowered by its lift so the slab seats on the top storey's walls when the house is assembled.
 */
export function roofPosition(layout) {
  assertLayout(layout);
  if (layout === 'exploded') return roofPlacement(levelPlacement('exploded', ROOF.anchorLevel));
  const top = levelPlacement('assembled', LEVEL_SPECS[LEVEL_SPECS.length - 1].id);
  return [top[0] + 3, top[1] - ROOF.lift, top[2] + 3];
}
