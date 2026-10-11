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

/**
 * The four sides of a ring between an outer and an inner half-size, as [[x0, z0], [x1, z1]] in plan.
 * North and south run the full width; east and west butt between them, so no corner faces coincide.
 */
function ring([outerW, outerD], [innerW, innerD]) {
  return {
    north: [[-outerW, -outerD], [outerW, -innerD]],
    south: [[-outerW, innerD], [outerW, outerD]],
    west: [[-outerW, -innerD], [-innerW, innerD]],
    east: [[innerW, -innerD], [outerW, innerD]],
  };
}

/** One box per side of a ring, between heights `bottom` and `top`. */
function ringBoxes(name, sides, bottom, top, material) {
  return Object.entries(sides).map(([side, [[x0, z0], [x1, z1]]]) => box(`roof:${name}:${side}`, [x0, bottom, z0], [x1, top, z1], material));
}

/**
 * The roof's boxes. `finish` dresses it for the street front: `walls` is the parapets' and slab
 * edges' material, `coping` caps the parapets, a hair proud on both faces, and `front` lists pieces
 * on the street (south) face, each `{ id, x, y, out, material }` with x from the west edge, y up from
 * the slab's underside (the top level's wall top) and `out` outward from the face.
 */
export function roofBoxes(size = BASE_SIZE, finish = {}, roof = ROOF) {
  const half = size.map((v) => v / 2);
  const inner = half.map((v) => v - roof.parapetThickness);
  const [halfW, halfD] = half;
  const { slabBottom, slabTop, parapetTop } = roofHeights(roof);
  const walls = finish.walls ?? 'wall';
  const slabEdges = finish.walls ? { faces: { px: walls, nx: walls, pz: walls, nz: walls } } : {};
  const boxes = [
    box('roof:slab', [-halfW, slabBottom, -halfD], [halfW, slabTop, halfD], 'structure', slabEdges),
    ...ringBoxes('parapet', ring(half, inner), slabTop, parapetTop, walls),
    box('roof:membrane', [-inner[0], slabTop, -inner[1]], [inner[0], slabTop + roof.membraneThickness, inner[1]], 'slate'),
  ];
  if (finish.coping) {
    const o = roof.copingOverhang;
    const sides = ring(half.map((v) => v + o), inner.map((v) => v - o));
    boxes.push(...ringBoxes('coping', sides, parapetTop, parapetTop + roof.copingThickness, finish.coping));
  }
  for (const piece of finish.front ?? []) {
    boxes.push(box(`roof:front:${piece.id}`, [piece.x[0] - halfW, slabBottom + piece.y[0], halfD + piece.out[0]], [piece.x[1] - halfW, slabBottom + piece.y[1], halfD + piece.out[1]], piece.material));
  }
  return boxes;
}

/** World position of the roof's reference point (footprint centre at floor level) for a level offset. */
export function roofPlacement(levelOffset, size = BASE_SIZE, roof = ROOF) {
  return [levelOffset[0] + size[0] / 2 + roof.shift[0], levelOffset[1], levelOffset[2] + size[1] / 2 + roof.shift[1]];
}

/** World bounds of the placed roof, for fitting the camera. */
export function roofBounds(placement, size = BASE_SIZE, finish = {}, roof = ROOF) {
  return translate(unionBounds(roofBoxes(size, finish, roof)), placement);
}
