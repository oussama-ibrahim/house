// Checks 2, 3, 4 and 11: headroom, stair alignment across levels, clear width, handrail.
import { CHECKS, INTERIOR, PARTITION_THICKNESS, WALL_HEIGHT } from '../spec/global.js';
import { roomRects } from '../spec/helpers.js';
import { EPS, overlap, rectContains, rectsEqual, rectsOverlapInPlan } from '../model/box.js';
import { levelById } from '../model/house.js';
import { findRoom } from '../model/level.js';
import { handrailCentrelineY, nosings, pitch } from '../model/stair.js';
import { result } from './result.js';

function treadRect(tread) {
  return { x: [tread.min[0], tread.max[0]], z: [tread.min[2], tread.max[2]] };
}

export function checkHeadroom(house) {
  const ground = levelById(house, 'ground');
  const first = levelById(house, 'first');
  const failures = [];
  let underSlab = 0;
  for (const tread of ground.model.treads) {
    const covered = first.spec.slabs.some((slab) => rectsOverlapInPlan(slab, treadRect(tread)));
    if (!covered) continue;
    underSlab += 1;
    const headroom = WALL_HEIGHT - tread.max[1];
    if (headroom < CHECKS.minHeadroom - EPS) {
      failures.push(`tread ${tread.tread} sits under the upper slab with ${headroom.toFixed(2)} m headroom`);
    }
  }
  return result(2, 'Headroom over the flight', failures, [`${underSlab} tread(s) under a slab box`]);
}

/** The ground room the landing sits over, allowing for the partition along that room's edge. */
function roomUnderLanding(ground, landing) {
  return ground.spec.rooms.find((room) => {
    const withPartitions = {
      x: [room.x[0] - PARTITION_THICKNESS, room.x[1] + PARTITION_THICKNESS],
      z: [room.z[0] - PARTITION_THICKNESS, room.z[1] + PARTITION_THICKNESS],
    };
    return rectContains(withPartitions, landing) && rectsOverlapInPlan(room, landing);
  });
}

/** The strip the top riser lands on: the stair's width, from the interior face to the flight's top. */
function arrivalRect(stair) {
  return { x: stair.x, z: [INTERIOR.min, stair.bottomZ - stair.going * stair.treadCount] };
}

export function checkStairAlignment(house) {
  const ground = levelById(house, 'ground');
  const first = levelById(house, 'first');
  const stairRoom = findRoom(ground.model, 'stair');
  const voidRoom = findRoom(first.model, 'void');
  const stair = ground.spec.stair;
  const arrival = arrivalRect(stair);
  const failures = [];
  if (!rectsEqual(stairRoom, voidRoom)) failures.push('the ground-level stair room and the first-level void do not coincide');
  const flight = { x: stair.x, z: [stair.bottomZ - stair.going * stair.treadCount, stair.bottomZ] };
  if (!rectContains(voidRoom, flight)) failures.push('the flight extends beyond the void');
  const landingRoom = first.spec.rooms.find((room) => room.finish && roomRects(room).some((rect) => rectContains(rect, arrival)));
  if (!landingRoom) failures.push('no finished first-level room contains the stair arrival');
  const below = roomUnderLanding(ground, arrival);
  if (!below) failures.push('the stair arrival does not sit over a single ground-level room');
  return result(3, 'Stair void over the flight, arrival inside a room and over a room below', failures, [
    `stair room x ${stairRoom.x.join('–')}, z ${stairRoom.z.join('–')}; arrival in ${landingRoom ? landingRoom.name.toLowerCase() : 'nothing'}, over ${below ? below.name.toLowerCase() : 'nothing'}`,
  ]);
}

/** Walls whose envelope touches the stair strip along one flank, over the flight's length. */
function flankWalls(ground, stair, side) {
  const flightZ = [stair.bottomZ - stair.going * stair.treadCount, stair.bottomZ];
  const strip = { min: [stair.x[0], 0, flightZ[0]], max: [stair.x[1], 0, flightZ[1]] };
  return ground.model.walls
    .filter(({ envelope }) => overlap(envelope, strip, 2) > EPS)
    .filter(({ envelope }) => (side === 'west' ? Math.abs(envelope.max[0] - stair.x[0]) : Math.abs(envelope.min[0] - stair.x[1])) < EPS)
    .map(({ wall }) => wall.id);
}

export function checkStairWidth(house) {
  const ground = levelById(house, 'ground');
  const stair = ground.spec.stair;
  const width = stair.x[1] - stair.x[0];
  const west = flankWalls(ground, stair, 'west');
  const east = flankWalls(ground, stair, 'east');
  const failures = [];
  if (Math.abs(width - 1.25) > EPS) failures.push(`clear width is ${width.toFixed(3)} m, not 1.25`);
  if (west.length === 0) failures.push(`no wall face at x ${stair.x[0]} along the flight's west side`);
  if (east.length === 0) failures.push(`no wall face at x ${stair.x[1]} along the flight's east side`);
  for (const tread of ground.model.treads) {
    if (tread.min[0] < stair.x[0] - EPS || tread.max[0] > stair.x[1] + EPS) {
      failures.push(`tread ${tread.tread} spans x ${tread.min[0]}–${tread.max[0]}, outside ${stair.x[0]}–${stair.x[1]}`);
    }
  }
  return result(4, 'Stair clear width', failures, [
    `${west.join('/') || '?'} face ${stair.x[0].toFixed(2)}, ${east.join('/') || '?'} face ${stair.x[1].toFixed(2)}, width ${width.toFixed(2)} m`,
  ]);
}

export function checkHandrail(house) {
  const ground = levelById(house, 'ground');
  const stair = ground.spec.stair;
  const rail = stair.handrail;
  const failures = [];
  for (const nosing of nosings(stair)) {
    const above = handrailCentrelineY(stair, nosing.z) - nosing.y;
    if (Math.abs(above - rail.aboveNosing) > EPS) {
      failures.push(`rail is ${above.toFixed(3)} m above nosing ${nosing.n}, not ${rail.aboveNosing}`);
    }
  }
  // The rail's underside at the north (highest) edge of each tread must clear that tread's top.
  const halfDepth = rail.section / 2 / Math.cos(Math.atan(pitch(stair)));
  for (const tread of ground.model.treads) {
    const underside = handrailCentrelineY(stair, tread.min[2]) - halfDepth;
    if (underside <= tread.max[1] + EPS) failures.push(`rail underside touches tread ${tread.tread}`);
  }
  const box = ground.model.handrail;
  return result(11, 'Handrail height and clearance', failures, [
    `on the ${rail.side} wall, centreline x ${box.centre[0].toFixed(3)}, from y ${handrailCentrelineY(stair, rail.zFrom).toFixed(2)} at z ${rail.zFrom} to y ${handrailCentrelineY(stair, rail.zTo).toFixed(2)} at z ${rail.zTo}`,
  ]);
}
