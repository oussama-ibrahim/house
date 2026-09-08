// Part 3. An all-steel quarter-turn stair. From the living room a short starter leg climbs east
// along the front wall, approached head-on from the entrance, onto a landing platform in the
// south-east corner; from there the main flight climbs north against the blind east wall (the party
// wall) and lands in the upstairs hall. 16 risers in all: 4 to the landing, 12 on the main flight.
// Both legs are marble tread plates with open risers on black stringers, the landing a plate on a
// steel frame and four posts, so the space under the whole stair is open to the living room; a
// wall rail on the party wall and a guard along every open side.
export const STAIR = Object.freeze({
  // Main flight strip between the open west side and the east wall face.
  x: Object.freeze([4.7, 5.95]),
  riser: 0.18,
  // Starter leg: (risers − 1) treads climbing east, ending at the main strip's west face, spanning
  // the landing's depth; the last riser steps up onto the landing.
  starter: Object.freeze({ risers: 4, going: 0.27 }),
  landing: Object.freeze({ z: Object.freeze([5.7, 7.0]) }),
  // Main flight from the landing's north edge northward; its risers are counted on from the landing.
  bottomZ: 5.7,
  going: 0.25,
  risers: 12,
  treadCount: 11,
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
    // One going in from the landing and one going past the top nosing.
    zFrom: 5.45,
    zTo: 3.2,
    aboveNosing: 0.9,
    material: 'joinery',
  }),
});
