// A flat roof lifted clear of the house: the slab, a parapet all round and a membrane inside it.
// Coordinates are relative to the footprint centre at floor level, so the scene can place the whole
// roof as one unit.
import { FOOTPRINT, WALL_HEIGHT } from '../spec/global.js';
import { ROOF } from '../spec/presentation.js';
import { box, translate, unionBounds } from './box.js';

export function roofHeights(roof = ROOF) {
  const slabBottom = WALL_HEIGHT + roof.lift;
  const slabTop = slabBottom + roof.slabThickness;
  return { slabBottom, slabTop, parapetTop: slabTop + roof.parapetHeight };
}

export function roofBoxes(roof = ROOF) {
  const half = FOOTPRINT / 2;
  const inner = half - roof.parapetThickness;
  const { slabBottom, slabTop, parapetTop } = roofHeights(roof);
  const boxes = [box('roof:slab', [-half, slabBottom, -half], [half, slabTop, half], 'structure')];

  // North and south parapets run the full width; east and west butt between them, so no corner
  // faces coincide.
  const parapets = {
    north: [[-half, -half], [half, -inner]],
    south: [[-half, inner], [half, half]],
    west: [[-half, -inner], [-inner, inner]],
    east: [[inner, -inner], [half, inner]],
  };
  for (const [name, [[x0, z0], [x1, z1]]] of Object.entries(parapets)) {
    boxes.push(box(`roof:parapet:${name}`, [x0, slabTop, z0], [x1, parapetTop, z1], 'wall'));
  }
  boxes.push(box('roof:membrane', [-inner, slabTop, -inner], [inner, slabTop + roof.membraneThickness, inner], 'slate'));
  return boxes;
}

/** World position of the roof's reference point (footprint centre at floor level) for a level offset. */
export function roofPlacement(levelOffset, roof = ROOF) {
  return [levelOffset[0] + FOOTPRINT / 2 + roof.shift[0], levelOffset[1], levelOffset[2] + FOOTPRINT / 2 + roof.shift[1]];
}

/** World bounds of the placed roof, for fitting the camera. */
export function roofBounds(placement, roof = ROOF) {
  return translate(unionBounds(roofBoxes(roof)), placement);
}
