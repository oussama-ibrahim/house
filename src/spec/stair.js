// Part 3. The flight sits against the blind east wall (the party wall) and climbs northward from the
// south wall face; 16 risers, 15 treads. The handrail is fixed to that wall, the only wall the
// flight runs along.
export const STAIR = Object.freeze({
  x: Object.freeze([4.55, 5.8]),
  bottomZ: 5.8,
  riser: 0.18,
  going: 0.25,
  risers: 16,
  treadCount: 15,
  // A cast flight, not a solid stack: each tread box reaches down one riser plus a 0.22 m waist,
  // so the space under the upper treads is free for the store reached from the living room.
  underside: 0.4,
  handrail: Object.freeze({
    side: 'east',
    section: 0.05,
    wallOffset: 0.05,
    zFrom: 5.55,
    zTo: 2.3,
    aboveNosing: 0.9,
    material: 'joinery',
  }),
});
