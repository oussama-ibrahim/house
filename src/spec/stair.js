import { INTERIOR, SLAB_OPENING } from './global.js';

// Part 3. An all-steel quarter-turn stair, fitted to the first-floor slab as built: its opening is
// 3.00 m long and ends 1.80 m from the street wall (site facts the user gave). The main flight's 12
// treads fill the opening exactly; everything south of it sits under the slab and so stays low: a
// short starter leg climbs east along the front wall, approached from the front door, onto a
// landing at 0.54, the highest a step may stand under the slab and keep 2.05 m of headroom. From
// there the main flight climbs north against the blind east wall (the party wall) and lands in the
// upstairs hall. 16 risers in all: 3 to the landing, 13 on the main flight.
// Both legs are marble tread plates with open risers on black stringers, the landing a plate on a
// steel frame and four posts, so the space under the whole stair is open to the living room; a
// wall rail on the party wall and a guard along every open side.
export const STAIR = Object.freeze({
  // Main flight strip between the open west side and the east wall face.
  x: SLAB_OPENING.x,
  riser: 0.18,
  // Starter leg: (risers − 1) treads climbing east, ending at the main strip's west face, spanning
  // the landing's depth; the last riser steps up onto the landing.
  starter: Object.freeze({ risers: 3, going: 0.27 }),
  // From the slab opening's south edge to the ground level's street-wall face: 0.80 m, so the
  // starter leg is that wide too.
  landing: Object.freeze({ z: Object.freeze([SLAB_OPENING.z[1], INTERIOR.zMax]) }),
  // Main flight from the landing's north edge northward; its risers are counted on from the landing.
  bottomZ: SLAB_OPENING.z[1],
  going: 0.25,
  risers: 13,
  treadCount: 12,
  // The landing at the top must be at least this deep north of the top riser, one flight width.
  arrivalDepth: 1.25,
  // Steelwork: tread plates on stringers whose top edge runs just under the nosing line; the same
  // section frames the landing.
  steel: Object.freeze({
    treadThickness: 0.04,
    treadMaterial: 'marble',
    stringer: Object.freeze({ depth: 0.2, thickness: 0.02, belowNosing: 0.1, material: 'frame' }),
  }),
  // Guard along the open sides, the main flight's west and the starter leg's north: posts and a
  // rail 0.90 above the nosings, meeting at a newel on the landing's corner.
  guard: Object.freeze({ side: 'west', section: 0.04, post: 0.03, postEvery: 3, material: 'frame' }),
  handrail: Object.freeze({
    side: 'east',
    section: 0.05,
    wallOffset: 0.05,
    // One going in from the landing to the top nosing.
    zFrom: 5.95,
    zTo: 3.45,
    aboveNosing: 0.9,
    material: 'joinery',
  }),
});
