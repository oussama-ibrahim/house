// A flat roof lifted clear of the house: the slab, a parapet all round and a membrane inside it.
// Coordinates are relative to the footprint centre at floor level, so the scene can place the whole
// roof as one unit. The roof takes the size of the level it covers.
import { FOOTPRINT, WALL_HEIGHT } from '../spec/global.js';
import { ROOF } from '../spec/presentation.js';
import { box, translate, unionBounds } from './box.js';

const BASE_SIZE = Object.freeze([FOOTPRINT.width, FOOTPRINT.depth]);

export function roofHeights(roof = ROOF) {
  const slabBottom = WALL_HEIGHT + roof.lift;
  const slabTop = slabBottom + roof.slabThickness;
  return { slabBottom, slabTop, parapetTop: slabTop + roof.parapetHeight };
}

export function roofBoxes(size = BASE_SIZE, roof = ROOF) {
  const [halfW, halfD] = size.map((v) => v / 2);
  const innerW = halfW - roof.parapetThickness;
  const innerD = halfD - roof.parapetThickness;
  const { slabBottom, slabTop, parapetTop } = roofHeights(roof);
  const boxes = [box('roof:slab', [-halfW, slabBottom, -halfD], [halfW, slabTop, halfD], 'structure')];

  // North and south parapets run the full width; east and west butt between them, so no corner
  // faces coincide.
  const parapets = {
    north: [[-halfW, -halfD], [halfW, -innerD]],
    south: [[-halfW, innerD], [halfW, halfD]],
    west: [[-halfW, -innerD], [-innerW, innerD]],
    east: [[innerW, -innerD], [halfW, innerD]],
  };
  for (const [name, [[x0, z0], [x1, z1]]] of Object.entries(parapets)) {
    boxes.push(box(`roof:parapet:${name}`, [x0, slabTop, z0], [x1, parapetTop, z1], 'wall'));
  }
  boxes.push(box('roof:membrane', [-innerW, slabTop, -innerD], [innerW, slabTop + roof.membraneThickness, innerD], 'slate'));
  return boxes;
}

/** World position of the roof's reference point (footprint centre at floor level) for a level offset. */
export function roofPlacement(levelOffset, size = BASE_SIZE, roof = ROOF) {
  return [levelOffset[0] + size[0] / 2 + roof.shift[0], levelOffset[1], levelOffset[2] + size[1] / 2 + roof.shift[1]];
}

/** World bounds of the placed roof, for fitting the camera. */
export function roofBounds(placement, size = BASE_SIZE, roof = ROOF) {
  return translate(unionBounds(roofBoxes(size, roof)), placement);
}
