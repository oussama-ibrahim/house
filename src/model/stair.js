// Part 3. An all-steel quarter-turn stair: thin tread plates on sloped stringers for both legs, a
// landing platform on four posts, a wall rail on the party wall and a guard along every open side.
import { box } from './box.js';

export function pitch(stair) {
  return stair.riser / stair.going;
}

function starterPitch(stair) {
  return stair.riser / stair.starter.going;
}

/** Height of the quarter landing: the starter leg's risers. */
export function landingHeight(stair) {
  return stair.starter.risers * stair.riser;
}

/** Foot of the starter leg: its treads end at the main strip's west face. */
export function starterFootX(stair) {
  return stair.x[0] - (stair.starter.risers - 1) * stair.starter.going;
}

/** Plan rectangle of the starter leg. */
export function starterRect(stair) {
  return { x: [starterFootX(stair), stair.x[0]], z: [...stair.landing.z] };
}

/** Plan rectangle of the landing. */
export function landingRect(stair) {
  return { x: [...stair.x], z: [...stair.landing.z] };
}

/** Top of the main flight: the north edge of its last tread, where the top riser meets the floor. */
export function flightTopZ(stair) {
  return stair.bottomZ - stair.going * stair.treadCount;
}

/** Height of the line through the starter leg's nosings at an x position; it meets the landing at the strip. */
export function starterNosingLineY(stair, x) {
  return stair.riser + starterPitch(stair) * (x - starterFootX(stair));
}

/** Height of the line through the main flight's nosings at a z position. */
export function nosingLineY(stair, z) {
  return pitch(stair) * (stair.bottomZ - z) + landingHeight(stair) + stair.riser;
}

function starterTreads(stair) {
  const { starter, landing, steel } = stair;
  const foot = starterFootX(stair);
  return Array.from({ length: starter.risers - 1 }, (_, i) => {
    const n = i + 1;
    const top = stair.riser * n;
    return box(`starter-${n}`, [foot + starter.going * (n - 1), top - steel.treadThickness, landing.z[0]], [foot + starter.going * n, top, landing.z[1]], steel.treadMaterial, { tread: n });
  });
}

/** The landing's walking surface: a plate at the landing height, counted as a step for headroom. */
function landingPlate(stair) {
  const { z } = stair.landing;
  const top = landingHeight(stair);
  return box('landing', [stair.x[0], top - stair.steel.treadThickness, z[0]], [stair.x[1], top, z[1]], stair.steel.treadMaterial, { tread: stair.starter.risers, landing: true });
}

/** Tread plates of the main flight; `tread` numbers carry on from the landing. */
export function mainTreads(stair) {
  const base = landingHeight(stair);
  const { treadThickness, treadMaterial } = stair.steel;
  return Array.from({ length: stair.treadCount }, (_, i) => {
    const n = i + 1;
    const north = stair.bottomZ - stair.going * n;
    const south = stair.bottomZ - stair.going * (n - 1);
    const top = base + stair.riser * n;
    return box(`tread-${n}`, [stair.x[0], top - treadThickness, north], [stair.x[1], top, south], treadMaterial, { tread: stair.starter.risers + n });
  });
}

/** Every step box in climbing order: starter treads, landing, main flight. */
export function treadBoxes(stair) {
  return [...starterTreads(stair), landingPlate(stair), ...mainTreads(stair)];
}

/** Nosing of main tread n: its south (front) edge, one riser per step above the landing. */
export function nosings(stair) {
  const base = landingHeight(stair);
  return Array.from({ length: stair.treadCount }, (_, i) => {
    const n = i + 1;
    return { n, z: stair.bottomZ - stair.going * (n - 1), y: base + stair.riser * n };
  });
}

/** Handrail centreline height: 0.90 above the line through the main flight's nosings. */
export function handrailCentrelineY(stair, z) {
  return nosingLineY(stair, z) + stair.handrail.aboveNosing;
}

/** Centreline x of the rail, offset from whichever flank wall it is fixed to. */
export function handrailX(stair) {
  const rail = stair.handrail;
  const inset = rail.wallOffset + rail.section / 2;
  return rail.side === 'west' ? stair.x[0] + inset : stair.x[1] - inset;
}

/** A box along the main flight between two z positions, `belowNosing` under the nosing line, rotated about X to the pitch. */
function slopedAlongZ(id, stair, x, zFrom, zTo, width, depth, belowNosing, material) {
  const dz = zFrom - zTo;
  const dy = pitch(stair) * dz;
  const zMid = (zFrom + zTo) / 2;
  return {
    id,
    material,
    centre: [x, nosingLineY(stair, zMid) - belowNosing, zMid],
    size: [width, depth, Math.hypot(dz, dy)],
    rotationX: Math.atan(pitch(stair)),
  };
}

/** A box along the starter leg between two x positions, rotated about Z so its east end is high. */
function slopedAlongX(id, stair, z, xFrom, xTo, width, depth, belowNosing, material) {
  const dx = xTo - xFrom;
  const dy = starterPitch(stair) * dx;
  const xMid = (xFrom + xTo) / 2;
  return {
    id,
    material,
    centre: [xMid, starterNosingLineY(stair, xMid) - belowNosing, z],
    size: [Math.hypot(dx, dy), depth, width],
    rotationZ: Math.atan(starterPitch(stair)),
  };
}

/** A single box, rotated about X to the pitch angle so its north end is the high end. */
export function handrailBox(stair) {
  const rail = stair.handrail;
  return slopedAlongZ('handrail', stair, handrailX(stair), rail.zFrom, rail.zTo, rail.section, rail.section, -rail.aboveNosing, rail.material);
}

/** The stringers: two under the main flight from the landing to the top riser, two under the starter leg. */
export function stringerBoxes(stair) {
  const { stringer } = stair.steel;
  const half = stringer.thickness / 2;
  const below = stringer.belowNosing + stringer.depth / 2;
  const foot = starterFootX(stair);
  const [zNorth, zSouth] = stair.landing.z;
  return [
    slopedAlongZ('stringer-west', stair, stair.x[0] + half, stair.bottomZ, flightTopZ(stair), stringer.thickness, stringer.depth, below, stringer.material),
    slopedAlongZ('stringer-east', stair, stair.x[1] - half, stair.bottomZ, flightTopZ(stair), stringer.thickness, stringer.depth, below, stringer.material),
    slopedAlongX('starter-stringer-north', stair, zNorth + half, foot, stair.x[0], stringer.thickness, stringer.depth, below, stringer.material),
    slopedAlongX('starter-stringer-south', stair, zSouth - half, foot, stair.x[0], stringer.thickness, stringer.depth, below, stringer.material),
  ];
}

/** The landing's steel frame under its plate and the four posts that carry it to the floor. */
export function landingParts(stair) {
  const { stringer } = stair.steel;
  const { post } = stair.guard;
  const [x0, x1] = stair.x;
  const [z0, z1] = stair.landing.z;
  const plateBottom = landingHeight(stair) - stair.steel.treadThickness;
  const frame = box('landing-frame', [x0, plateBottom - stringer.depth, z0], [x1, plateBottom, z1], stringer.material);
  const corners = [
    [x0, z0],
    [x1 - post, z0],
    [x0, z1 - post],
    [x1 - post, z1 - post],
  ];
  const posts = corners.map(([x, z], i) => box(`landing-post-${i + 1}`, [x, 0, z], [x + post, plateBottom - stringer.depth, z + post], stringer.material));
  return { frame, posts };
}

/** Guards along the open sides: the main flight's west side and the starter leg's north side, meeting at a newel. */
export function guardParts(stair) {
  const { guard } = stair;
  if (!guard) return { rails: [], posts: [] };
  const above = stair.handrail.aboveNosing;
  const halfPost = guard.post / 2;
  const xMain = guard.side === 'west' ? stair.x[0] + guard.section / 2 : stair.x[1] - guard.section / 2;
  const mainRail = slopedAlongZ('guard-rail', stair, xMain, stair.bottomZ, flightTopZ(stair), guard.section, guard.section, -above, guard.material);
  const mainPosts = mainTreads(stair)
    .filter((_, i) => i % guard.postEvery === 0)
    .map((tread) => {
      const z = (tread.min[2] + tread.max[2]) / 2;
      const top = handrailCentrelineY(stair, z) - guard.section / 2;
      return box(`guard-post-${tread.tread}`, [xMain - halfPost, tread.max[1], z - halfPost], [xMain + halfPost, top, z + halfPost], guard.material);
    });

  const zStarter = stair.landing.z[0] + guard.section / 2;
  const foot = starterFootX(stair);
  const starterRail = slopedAlongX('starter-guard-rail', stair, zStarter, foot, stair.x[0], guard.section, guard.section, -above, guard.material);
  const starterPosts = starterTreads(stair)
    .filter((_, i) => i % 2 === 0)
    .map((tread) => {
      const x = (tread.min[0] + tread.max[0]) / 2;
      const top = starterNosingLineY(stair, x) + above - guard.section / 2;
      return box(`starter-guard-post-${tread.tread}`, [x - halfPost, tread.max[1], zStarter - halfPost], [x + halfPost, top, zStarter + halfPost], guard.material);
    });
  // The newel at the landing's corner takes both rails.
  const newelTop = handrailCentrelineY(stair, stair.bottomZ) + guard.section / 2;
  const newel = box('guard-newel', [stair.x[0], landingHeight(stair), stair.landing.z[0]], [stair.x[0] + guard.post, newelTop, stair.landing.z[0] + guard.post], guard.material);

  return { rails: [mainRail, starterRail], posts: [...mainPosts, ...starterPosts, newel] };
}
