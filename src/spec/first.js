// Part 5 — first level, v3. Two bedrooms and a shower room off a landing. The stair arrives at the
// north-east onto the landing; the shower room sits north of it, over the ground-floor kitchen, and
// drains to a boxed stack in the kitchen's empty north-east corner, so no pipe crosses the kitchen
// ceiling; the ground WC has its own stack on the west. The landing's leg runs south along the
// party wall to bedroom 1's door; bedroom 2 opens off its west side. The level projects 1 m over
// the street; the stair void is the slab opening as built, 3.00 m long, and the 1.80 m between it
// and the street wall belongs to bedroom 1, with a full-width dressing built into the street wall.
// A sliding glass door off the landing opens east onto the parents' garage roof, used as a terrace:
// the roof's top is this floor's level and its 1 m parapet is the guard.
import { firstFront } from './facades.js';
import { COLUMN, COLUMN_FRONT, EXTERIOR_WALL_THICKNESS, PARTITION_THICKNESS, SLAB_OPENING, UPPER_FOOTPRINT, UPPER_INTERIOR, WALL_HEIGHT } from './global.js';
import {
  clearZone,
  column,
  clearance,
  door,
  extent,
  label,
  midpoint,
  part,
  piece,
  room,
  slidingLeafParts,
  visibilityTarget,
  wall,
  windowOf,
} from './helpers.js';

const EXT = EXTERIOR_WALL_THICKNESS;
const PART = PARTITION_THICKNESS;
const { width: WIDTH, depth: DEPTH } = UPPER_FOOTPRINT;
// Both bedrooms' dressings are built into a wall floor to ceiling and swallow that room's column; a
// 2 cm skin covers the column's faces the room would see, so the dressing reads as one plane.
const DRESSING_SKIN = 0.02;
// P5, between bedroom 2 and the landing, and bedroom 2's east face on it.
const P5_AT = 3.6;
const BEDROOM2_EAST = P5_AT - PARTITION_THICKNESS / 2;

/** A floor-to-ceiling block over a plan rectangle. */
function fullHeight(xa, xb, za, zb) {
  return part(xb - xa, zb - za, WALL_HEIGHT, midpoint([xa, xb]), midpoint([za, zb]));
}

/** Bedroom 1: from the street-wall column to the party wall, along the street wall. */
function dressing1Parts() {
  const [cx0, cx1] = COLUMN_FRONT.x;
  const [cz0, cz1] = COLUMN_FRONT.z;
  const [x0, x1, z0, z1] = [cx0 - DRESSING_SKIN, UPPER_INTERIOR.xMax, cz0 - DRESSING_SKIN, UPPER_INTERIOR.zMax];
  return [
    fullHeight(cx1, x1, z0, z1),
    fullHeight(x0, cx1, cz1, z1),
    fullHeight(x0, cx1, z0, cz0),
    fullHeight(x0, cx0, cz0, cz1),
  ];
}

/** Bedroom 2: along P5 from the back wall to the column, which N1 already ties to P5. */
function dressing2Parts() {
  const [cx0] = COLUMN.x;
  const [cz0, cz1] = COLUMN.z;
  const front = cx0 - DRESSING_SKIN;
  return [fullHeight(front, BEDROOM2_EAST, UPPER_INTERIOR.min, cz0), fullHeight(front, cx0, cz0, cz1)];
}

// The void is the slab opening as built.
const [VOID_START, VOID_END] = SLAB_OPENING.z;

// The terrace door in the east wall, just north of the stair arrival and clear of the shower room's
// door: 0.90 m, its head on the window family's line. It slides, so no leaf swings across the landing.
const TERRACE_DOOR = Object.freeze({ z: Object.freeze([1.75, 2.65]), head: 2.4 });
// Its leaf runs on the east wall's outer face, drawn slid open south over the wall.
const TERRACE_LEAF = piece('slidingLeafD13', 'Terrace sliding glass door, open', 'glazing', slidingLeafParts(
  'z',
  [TERRACE_DOOR.z[1], TERRACE_DOOR.z[1] + extent(TERRACE_DOOR.z)],
  WIDTH + 0.02,
  TERRACE_DOOR.head - 0.05,
), { transparent: true });

// Bedroom 1's street window, shared with the street front dressed round it.
const BEDROOM_WINDOW = windowOf('Win11', 'room', 0.6);
const STREET_FRONT = firstFront({ window: BEDROOM_WINDOW });

export const FIRST = Object.freeze({
  id: 'first',
  name: 'First level',
  size: [WIDTH, DEPTH],
  stair: null,
  // Presentation: caption outside the north-east corner and dimensions on the two edges nearest the
  // south-east camera.
  caption: [7.25, -0.2],
  dimensionEdges: ['south', 'east'],
  ...STREET_FRONT,
  facadeDressing: { ...STREET_FRONT.facadeDressing, east: [TERRACE_LEAF] },

  // Every window is one of the family's types (WINDOW_TYPES); the west windows sit on the axes of the
  // ones below them. Bedroom 2 takes its daylight from the west only.
  walls: [
    wall('north', 'x', 0.1, EXT, 0, WIDTH, [windowOf('Win9', 'high', 4.2)], { exterior: true }),
    // Bedroom 1's window lights the bed zone; east of the column the street wall is filled by the
    // dressing, the user's choice, so it carries no window.
    wall('south', 'x', 8.1, EXT, 0, WIDTH, [BEDROOM_WINDOW], { exterior: true }),
    wall('west', 'z', 0.1, EXT, UPPER_INTERIOR.min, UPPER_INTERIOR.zMax, [
      windowOf('Win8', 'room', 0.5),
      windowOf('Win14', 'room', 4.7),
    ], { exterior: true }),
    wall('east', 'z', 6.05, EXT, UPPER_INTERIOR.min, UPPER_INTERIOR.zMax, [
      door('D13', ...TERRACE_DOOR.z, TERRACE_DOOR.head, { leaf: false, frame: true }),
    ], { exterior: true }),
    // P4 guards the stair void's west side; north of it the landing is open to the stair arrival.
    // P12 closes the void's south end; the 1.70 m beyond it, to the street wall, is bedroom 1's
    // dressing zone.
    wall('P4', 'z', 4.65, PART, VOID_START, VOID_END),
    wall('P12', 'x', VOID_END + PART / 2, PART, 4.6, UPPER_INTERIOR.xMax),
    // Bedroom 2's door sits just south of the column, its north jamb on the column's south face.
    wall('P5', 'z', P5_AT, PART, 0.2, 4.05, [door('D6', 3.0, 3.8, 2.05)]),
    wall('P7', 'x', 4.1, PART, 0.2, 4.6, [door('D7', 3.75, 4.55, 2.05)]),
    // P9 closes the shower room off the landing.
    wall('P9', 'x', 1.65, PART, 3.65, 5.95, [door('D11', 4.65, 5.35, 2.05)]),
    // The column stands in bedroom 2 inside its dressing; N1 fills the 0.35 m between it and P5 so
    // no pocket is left beside the door.
    column(COLUMN),
    // The street-wall column rises inside bedroom 1, the level overhanging 1 m past it, inside
    // bedroom 1's dressing.
    column(COLUMN_FRONT),
    wall('N1', 'x', midpoint(COLUMN.z), extent(COLUMN.z), COLUMN.x[1], BEDROOM2_EAST),
  ],

  rooms: [
    room('landing', 'Landing', [3.65, 5.95], [1.7, VOID_START], 'marble', 4.3, { extra: [{ x: [3.65, 4.6], z: [VOID_START, 4.05] }] }),
    room('shower', 'Shower room', [3.65, 5.95], [0.2, 1.6], 'tile', 3.2),
    // The void is the slab opening; past it the floor runs on to the street wall as bedroom 1's.
    room('void', 'Stair void', [...SLAB_OPENING.x], [VOID_START, VOID_END], null, 3.8),
    // Bedroom 2 less the column and its infill, x 2.95–3.55, z 2.75–3.00.
    room('bedroom2', 'Bedroom 2', [0.2, 2.95], [0.2, 4.05], 'wood', 12.7, {
      extra: [
        { x: [2.95, BEDROOM2_EAST], z: [0.2, 2.75] },
        { x: [2.95, BEDROOM2_EAST], z: [3.0, 4.05] },
      ],
    }),
    // With the 1.70 m zone between the stair void and the street wall, where the dressing stands.
    room('bedroom1', 'Bedroom 1', [0.2, 4.6], [4.15, 8.0], 'wood', 19.2, { extra: [{ x: [4.6, 5.95], z: [VOID_END + PART, 8.0] }] }),
  ],
  netArea: 43.2,

  // The slab has a hole exactly the void's outline; a strip under the east wall stays so the wall
  // bears on it all round, and the last metre cantilevers over the street.
  slabs: [
    { x: [0, 4.7], z: [0, DEPTH] },
    { x: [4.7, WIDTH], z: [0, VOID_START] },
    { x: [5.95, WIDTH], z: [VOID_START, DEPTH] },
    { x: [4.7, 5.95], z: [VOID_END, DEPTH] },
  ],

  clearZones: [
    clearZone('D6', [2.95, 4.25], [3.0, 3.9]),
    clearZone('D7', [3.65, 4.65], [3.45, 4.75]),
    clearZone('D11', [4.55, 5.45], [1.0, 2.3]),
  ],

  furniture: [
    // Bedroom 1: one dressing, the user's design, built into the street wall floor to ceiling across
    // the full width from the street-wall column to the party wall, with the column inside it: a 2 cm
    // wood skin covers the column's north and west faces, so the front and the west end each read as
    // one plane of joinery; behind the column it is closed panelling. The bed zone lies west of it.
    piece('bed1', 'Double bed', 'bedding', [part(1.6, 2.0, 0.5, 1.575, 5.27)]),
    piece('headboard1', 'Headboard, bedroom 1', 'joinery', [part(1.7, 0.12, 0.5, 1.575, 4.21)], { touches: ['P7'] }),
    piece('nightstand1W', 'Nightstand, bedroom 1 west', 'joinery', [part(0.4, 0.4, 0.45, 0.5, 4.4)]),
    piece('nightstand1E', 'Nightstand, bedroom 1 east', 'joinery', [part(0.4, 0.4, 0.45, 2.65, 4.4)]),
    piece('dressing1', 'Dressing, bedroom 1', 'joinery', dressing1Parts(), { touches: ['south', 'east', 'C2'] }),
    piece('bed2', 'Bed, bedroom 2', 'bedding', [part(1.4, 1.9, 0.5, 1.0, 2.98)]),
    piece('headboard2', 'Headboard, bedroom 2', 'joinery', [part(1.5, 0.12, 0.5, 1.0, 3.99)], { touches: ['P7'] }),
    piece('nightstand2', 'Nightstand, bedroom 2', 'joinery', [part(0.4, 0.4, 0.45, 1.95, 3.8)]),
    // Bedroom 2's dressing, the same as bedroom 1's: built into P5 floor to ceiling from the back wall
    // to the column, its front flush with the column's skin; the desk keeps 0.63 m clear of its doors.
    piece('dressing2', 'Dressing, bedroom 2', 'joinery', dressing2Parts(), { touches: ['north', 'P5', 'C1', 'N1'] }),
    piece('desk2', 'Desk, bedroom 2', 'joinery', [part(0.9, 0.55, 0.74, 1.85, 0.475)], { touches: ['north'] }),
    // Linen cupboard in the landing's north-west corner, doors to the south, off the walking line.
    piece('linen', 'Linen cupboard', 'joinery', [part(0.9, 0.4, 2.1, 4.1, 1.9)], { touches: ['P9', 'P5'] }),
    // Shower room: tray in the north-west corner entered from the south, WC under the north window
    // facing south, basin on the east wall.
    piece('showerTray1', 'Shower tray, upstairs', 'fittings', [part(0.9, 0.8, 0.08, 4.1, 0.6)], { touches: ['north', 'P5'] }),
    piece('screenE1', 'Shower screen, east panel, upstairs', 'glazing', [part(0.02, 0.8, 1.9, 4.54, 0.6, 0.08)], {
      touches: ['north'],
      transparent: true,
    }),
    piece('screenS1', 'Shower screen, south panel, upstairs', 'glazing', [part(0.4, 0.02, 1.9, 4.35, 0.99, 0.08)], {
      transparent: true,
    }),
    piece('wc1', 'WC, upstairs', 'fittings', [part(0.42, 0.65, 0.42, 5.16, 0.525)], { touches: ['north'] }),
    piece('basin1', 'Basin, upstairs', 'fittings', [part(0.4, 0.5, 0.85, 5.75, 1.3)], { touches: ['east'] }),
  ],

  // Visual dressing only: rendered, never measured by the acceptance checks.
  dressing: [
    piece('pillows1', 'Pillows', 'fittings', [
      part(0.6, 0.4, 0.12, 1.175, 4.55, 0.5),
      part(0.6, 0.4, 0.12, 1.975, 4.55, 0.5),
    ]),
    piece('throw1', 'Throw', 'upholstery', [part(1.6, 0.7, 0.04, 1.575, 5.85, 0.5)]),
    piece('pillow2', 'Pillow', 'fittings', [part(0.6, 0.4, 0.12, 1.0, 3.65, 0.5)]),
    piece('throw2', 'Throw', 'upholstery', [part(1.4, 0.6, 0.04, 1.0, 2.45, 0.5)]),
    piece('monitor', 'Monitor', 'appliance', [
      part(0.5, 0.03, 0.3, 1.85, 0.3, 0.85),
      part(0.06, 0.15, 0.11, 1.85, 0.35, 0.74),
    ]),
    piece('cistern1', 'Cistern, upstairs', 'fittings', [part(0.42, 0.15, 0.4, 5.16, 0.275, 0.42)]),
    // Bedroom 2's leaf is hinged on the south jamb and swings back toward P7, clear of the bed; bedroom 1's
    // on the west jamb; the shower room's on the west jamb beside the screen.
    piece('doorD6', 'Bedroom 2 door leaf, open', 'joinery', [part(0.8, 0.05, 2.05, 3.15, 3.825)]),
    piece('doorD7', 'Bedroom 1 door leaf, open', 'joinery', [part(0.05, 0.8, 2.05, 3.775, 4.55)]),
    piece('doorD11', 'Shower room door leaf, open', 'joinery', [part(0.05, 0.7, 2.05, 4.675, 1.25)]),
  ],

  // Offsets fan the pins outward; from the default south-east camera, north reads as up-right,
  // east as down-right, south as down-left and west as up-left. The ground level sits up-left of
  // this one, so nothing points that way.
  labels: [
    label('bedroom1', 'Bedroom 1 · master', [2.3, 5.9], [0.6, 2.2]),
    label('dressing1', 'Dressing', [4.6, 7.0], [1.4, 1.2]),
    label('bedroom2', 'Bedroom 2', [1.8, 2.2], [-2.2, -0.2]),
    label('landing', 'Landing · stair arrival', [4.8, 2.4], [1.6, -0.6]),
    label('shower', 'Shower room · stack in the corner duct', [4.8, 0.9], [1.4, -1.6]),
    label('void', 'Stair void', [5.35, 5.5], [1.2, 0.8]),
  ],

  clearances: [
    clearance('dressingRunDoors', 'Dressing, bedroom 1 (doors face north)', {
      axis: 'z',
      at: COLUMN_FRONT.z[0] - DRESSING_SKIN,
      direction: -1,
      span: [COLUMN_FRONT.x[1], UPPER_INTERIOR.xMax],
      ignore: ['dressing1'],
      expected: 0.63,
    }),
    clearance('dressing2Doors', 'Dressing, bedroom 2 (doors face west)', {
      axis: 'x',
      at: COLUMN.x[0] - DRESSING_SKIN,
      direction: -1,
      span: [UPPER_INTERIOR.min, COLUMN.z[0]],
      ignore: ['dressing2'],
      expected: 0.63,
    }),
    clearance('linenDoors', 'Linen cupboard (doors face south)', {
      axis: 'z',
      at: 2.1,
      direction: 1,
      span: [3.65, 4.55],
      ignore: ['linen'],
      expected: 1.95,
    }),
    clearance('showerEntry1', 'Shower entry, upstairs', {
      axis: 'z',
      at: 1.0,
      direction: 1,
      span: [3.65, 4.15],
      ignore: ['showerTray1', 'screenS1', 'screenE1'],
      expected: 0.6,
    }),
    clearance('wcFront1', 'WC, upstairs', {
      axis: 'z',
      at: 0.85,
      direction: 1,
      span: [4.95, 5.37],
      ignore: ['wc1'],
      expected: 0.75,
    }),
  ],

  visibilityTargets: [
    visibilityTarget('bed1', 100),
    visibilityTarget('bed2', 80),
    visibilityTarget('desk2', 100),
  ],
});
