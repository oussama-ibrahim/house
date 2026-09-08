import { WALL_HEIGHT } from '../spec/global.js';
import { unionBounds } from './box.js';
import { floorPatches, slabBoxes } from './floors.js';
import { furnitureBoxes } from './furniture.js';
import { guardParts, handrailBox, handrailCentrelineY, landingParts, stringerBoxes, treadBoxes } from './stair.js';
import { splitWall, wallEnvelope } from './walls.js';

/**
 * Pure geometry for one level at a given wall height. Everything the scene draws and everything
 * the acceptance checks measure comes from this object, so the two can never disagree.
 */
export function buildLevel(spec, options = {}) {
  const wallHeight = options.wallHeight ?? WALL_HEIGHT;
  return {
    spec,
    wallHeight,
    walls: spec.walls.map((wall) => ({ wall, envelope: wallEnvelope(wall, wallHeight), ...splitWall(wall, wallHeight) })),
    slabs: slabBoxes(spec),
    floors: floorPatches(spec),
    furniture: furnitureBoxes(spec.furniture),
    dressing: furnitureBoxes(spec.dressing ?? []),
    treads: spec.stair ? treadBoxes(spec.stair) : [],
    handrail: spec.stair ? handrailBox(spec.stair) : null,
    // Steelwork of the main flight: sloped stringers and guard rail, plus the guard's posts.
    stairwork: spec.stair ? stairwork(spec.stair) : { sloped: [], boxes: [] },
  };
}

function stairwork(stair) {
  const guard = guardParts(stair);
  const landing = landingParts(stair);
  return { sloped: [...stringerBoxes(stair), ...guard.rails], boxes: [landing.frame, ...landing.posts, ...guard.posts] };
}

export function wallSolids(level) {
  return level.walls.flatMap((entry) => entry.solids);
}

export function glazingBoxes(level) {
  return level.walls.flatMap((entry) => entry.glazing);
}

export function furnitureBoxList(level) {
  return level.furniture.flatMap((entry) => entry.boxes);
}

export function findWall(level, id) {
  const entry = level.walls.find((candidate) => candidate.wall.id === id);
  if (!entry) throw new Error(`Level ${level.spec.id} has no wall ${id}`);
  return entry;
}

export function findRoom(level, id) {
  const room = level.spec.rooms.find((candidate) => candidate.id === id);
  if (!room) throw new Error(`Level ${level.spec.id} has no room ${id}`);
  return room;
}

/** Axis-aligned bounds of everything on the level, in level coordinates, for fitting the camera. */
export function levelBounds(level) {
  const boxes = [
    ...level.walls.map((entry) => entry.envelope),
    ...level.slabs,
    ...level.floors,
    ...furnitureBoxList(level),
    ...level.dressing.flatMap((entry) => entry.boxes),
    ...level.treads,
  ];
  if (level.handrail) {
    const rail = level.spec.stair.handrail;
    const [x] = level.handrail.centre;
    boxes.push({
      min: [x - rail.section, handrailCentrelineY(level.spec.stair, rail.zFrom) - rail.section, rail.zTo],
      max: [x + rail.section, handrailCentrelineY(level.spec.stair, rail.zTo) + rail.section, rail.zFrom],
    });
  }
  return unionBounds(boxes);
}

export function findPiece(level, id, { dressing = false } = {}) {
  const list = dressing ? level.dressing : level.furniture;
  const entry = list.find((candidate) => candidate.piece.id === id);
  if (!entry) throw new Error(`Level ${level.spec.id} has no ${dressing ? 'dressing' : 'furniture'} piece ${id}`);
  return entry;
}
