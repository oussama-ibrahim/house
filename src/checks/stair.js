// Checks 2, 3, 4 and 11: headroom, stair alignment across levels, clear width, handrail.
import { CHECKS, PARTITION_THICKNESS, WALL_HEIGHT } from '../spec/global.js';
import { roomRects } from '../spec/helpers.js';
import { EPS, overlap, rectContains, rectsOverlapInPlan } from '../model/box.js';
import { levelById } from '../model/house.js';
import { findRoom } from '../model/level.js';
import { flightTopZ, handrailCentrelineY, landingRect, mainTreads, nosings, pitch, starterRect } from '../model/stair.js';
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

const COVER_SAMPLES = 8;

/** True when every point of `rect` lies in one of the room's rectangles, each grown by a partition. */
function roomCovers(room, rect) {
  const grown = roomRects(room).map((r) => ({
    x: [r.x[0] - PARTITION_THICKNESS, r.x[1] + PARTITION_THICKNESS],
    z: [r.z[0] - PARTITION_THICKNESS, r.z[1] + PARTITION_THICKNESS],
  }));
  for (let i = 0; i < COVER_SAMPLES; i++) {
    for (let j = 0; j < COVER_SAMPLES; j++) {
      const x = rect.x[0] + ((rect.x[1] - rect.x[0]) * (i + 0.5)) / COVER_SAMPLES;
      const z = rect.z[0] + ((rect.z[1] - rect.z[0]) * (j + 0.5)) / COVER_SAMPLES;
      const point = { x: [x, x], z: [z, z] };
      if (!grown.some((r) => rectContains(r, point))) return false;
    }
  }
  return true;
}

/** The ground room the landing sits over, allowing for the partition along that room's edge. */
function roomUnderLanding(ground, landing) {
  return ground.spec.rooms.find((room) => roomCovers(room, landing) && roomRects(room).some((rect) => rectsOverlapInPlan(rect, landing)));
}

/** The strip the top riser lands on: the stair's width, one arrival depth north of the flight's top. */
function arrivalRect(stair) {
  const top = flightTopZ(stair);
  return { x: stair.x, z: [top - stair.arrivalDepth, top] };
}

export function checkStairAlignment(house) {
  const ground = levelById(house, 'ground');
  const first = levelById(house, 'first');
  const voidRoom = findRoom(first.model, 'void');
  const stair = ground.spec.stair;
  const arrival = arrivalRect(stair);
  const failures = [];
  // The slab opening is a site fact: it must cover the main flight exactly, no more and no less.
  const flight = { x: stair.x, z: [flightTopZ(stair), stair.bottomZ] };
  const exact = [0, 1].every((i) => Math.abs(voidRoom.x[i] - flight.x[i]) < EPS && Math.abs(voidRoom.z[i] - flight.z[i]) < EPS);
  if (!exact) failures.push(`the first-level void (x ${voidRoom.x.join('–')}, z ${voidRoom.z.join('–')}) does not cover the main flight exactly`);
  // The landing and the starter leg sit under the upper floor; check 2 proves their headroom.
  for (const [name, rect] of [['landing', landingRect(stair)], ['starter leg', starterRect(stair)]]) {
    if (rectsOverlapInPlan(voidRoom, rect)) failures.push(`the ${name} opens into the void`);
    if (!first.spec.slabs.some((slab) => rectContains(slab, rect))) failures.push(`no first-level slab covers the ${name}`);
  }
  const landingRoom = first.spec.rooms.find((room) => room.finish && roomRects(room).some((rect) => rectContains(rect, arrival)));
  if (!landingRoom) failures.push('no finished first-level room contains the stair arrival');
  const below = roomUnderLanding(ground, arrival);
  if (!below) failures.push('the stair arrival does not sit over a single ground-level room');
  return result(3, 'Stair void over the main flight, arrival inside a room and over a room below', failures, [
    `void x ${voidRoom.x.join('–')}, z ${voidRoom.z.join('–')} over the main flight; landing and starter leg under the upper floor; arrival in ${landingRoom ? landingRoom.name.toLowerCase() : 'nothing'}, over ${below ? below.name.toLowerCase() : 'nothing'}`,
  ]);
}

/**
 * Walls whose envelope touches the stair strip along one flank, over the flight's length. Only walls
 * running with the flight (along z) can flank it; a cross wall merely ending at the strip cannot.
 */
function flankWalls(ground, stair, side) {
  const flightZ = [stair.bottomZ - stair.going * stair.treadCount, stair.bottomZ];
  const strip = { min: [stair.x[0], 0, flightZ[0]], max: [stair.x[1], 0, flightZ[1]] };
  return ground.model.walls
    .filter(({ wall }) => wall.axis === 'z')
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
  // Each flank needs either a wall face or the guard on the open side.
  const guarded = (side) => stair.guard?.side === side;
  if (west.length === 0 && !guarded('west')) failures.push(`no wall face or guard at x ${stair.x[0]} along the flight's west side`);
  if (east.length === 0 && !guarded('east')) failures.push(`no wall face or guard at x ${stair.x[1]} along the flight's east side`);
  // Main treads and the landing stay inside the strip; starter treads stay inside their own leg.
  const starter = starterRect(stair);
  for (const tread of ground.model.treads) {
    const strip = tread.id.startsWith('starter-') ? starter.x : stair.x;
    if (tread.min[0] < strip[0] - EPS || tread.max[0] > strip[1] + EPS) {
      failures.push(`step ${tread.tread} spans x ${tread.min[0]}–${tread.max[0]}, outside ${strip[0]}–${strip[1]}`);
    }
  }
  return result(4, 'Stair clear width', failures, [
    `${west.join('/') || (guarded('west') ? 'guard' : '?')} at ${stair.x[0].toFixed(2)}, ${east.join('/') || (guarded('east') ? 'guard' : '?')} at ${stair.x[1].toFixed(2)}, width ${width.toFixed(2)} m`,
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
  for (const tread of mainTreads(stair)) {
    const underside = handrailCentrelineY(stair, tread.min[2]) - halfDepth;
    if (underside <= tread.max[1] + EPS) failures.push(`rail underside touches step ${tread.tread}`);
  }
  const box = ground.model.handrail;
  return result(11, 'Handrail height and clearance', failures, [
    `on the ${rail.side} wall, centreline x ${box.centre[0].toFixed(3)}, from y ${handrailCentrelineY(stair, rail.zFrom).toFixed(2)} at z ${rail.zFrom} to y ${handrailCentrelineY(stair, rail.zTo).toFixed(2)} at z ${rail.zTo}`,
  ]);
}
