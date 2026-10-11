// Part 5 — first level, v3. Two bedrooms and a shower room off a landing. The stair arrives at the
// north-east onto the landing; the shower room sits north of it, over the ground-floor kitchen, and
// drains to a boxed stack in the kitchen's empty north-east corner, so no pipe crosses the kitchen
// ceiling; the ground WC has its own stack on the west. The landing's leg runs south along the
// party wall to bedroom 1's door; bedroom 2 opens off its west side. The level projects 1 m over
// the street; the stair void runs on to the front wall over the overhang, lit by the stair slot.
import { COLUMN, EXTERIOR_WALL_THICKNESS, PARTITION_THICKNESS, UPPER_FOOTPRINT, UPPER_INTERIOR } from './global.js';
import {
  clearZone,
  column,
  clearance,
  door,
  label,
  part,
  piece,
  room,
  visibilityTarget,
  wall,
  windowOf,
} from './helpers.js';

const EXT = EXTERIOR_WALL_THICKNESS;
const PART = PARTITION_THICKNESS;
const { width: WIDTH, depth: DEPTH } = UPPER_FOOTPRINT;

export const FIRST = Object.freeze({
  id: 'first',
  name: 'First level',
  size: [WIDTH, DEPTH],
  stair: null,
  // Presentation: caption outside the north-east corner and dimensions on the two edges nearest the
  // south-east camera.
  caption: [7.25, -0.2],
  dimensionEdges: ['south', 'east'],
  // Outer finish of the exterior walls: the overhanging box is clad, the ground level stays white.
  facade: 'cladding',

  // Every window is one of the family's types (WINDOW_TYPES) and sits on the axis of the window
  // below it. Bedroom 2 takes its daylight from the west only.
  walls: [
    wall('north', 'x', 0.1, EXT, 0, WIDTH, [windowOf('Win9', 'high', 4.2)], { exterior: true }),
    // Bedroom 1's picture window on the living room's axis, and the upper half of the stair slot
    // over the void.
    wall('south', 'x', 8.1, EXT, 0, WIDTH, [
      windowOf('Win11', 'picture', 1.45),
      windowOf('Win15', 'slotUpper', 5.1),
    ], { exterior: true }),
    wall('west', 'z', 0.1, EXT, UPPER_INTERIOR.min, UPPER_INTERIOR.zMax, [
      windowOf('Win8', 'room', 0.5),
      windowOf('Win14', 'room', 4.7),
    ], { exterior: true }),
    wall('east', 'z', 6.05, EXT, UPPER_INTERIOR.min, UPPER_INTERIOR.zMax, [windowOf('Win13', 'high', 1.8)], { exterior: true }),
    // P4 guards the stair void's west side all the way to the front wall; north of it the landing is
    // open to the stair arrival.
    wall('P4', 'z', 4.65, PART, 2.95, 8.0),
    // Bedroom 2's door sits just south of the column, its north jamb on the column's south face.
    wall('P5', 'z', 3.6, PART, 0.2, 4.05, [door('D6', 3.0, 3.8, 2.05)]),
    wall('P7', 'x', 4.1, PART, 0.2, 4.6, [door('D7', 3.75, 4.55, 2.05)]),
    // P9 closes the shower room off the landing.
    wall('P9', 'x', 1.65, PART, 3.65, 5.95, [door('D11', 4.65, 5.35, 2.05)]),
    // The column stands in bedroom 2 with its west face on the wardrobe front line; N1 fills the
    // 0.35 m between it and P5 so no pocket is left beside the door.
    column(COLUMN),
    wall('N1', 'x', (COLUMN.z[0] + COLUMN.z[1]) / 2, COLUMN.z[1] - COLUMN.z[0], COLUMN.x[1], 3.55),
  ],

  rooms: [
    room('landing', 'Landing', [3.65, 5.95], [1.7, 2.95], 'marble', 3.9, { extra: [{ x: [3.65, 4.6], z: [2.95, 4.05] }] }),
    room('shower', 'Shower room', [3.65, 5.95], [0.2, 1.6], 'tile', 3.2),
    // The void runs past the stair room to the front wall, over the overhang, up to the stair slot.
    room('void', 'Stair void', [4.7, 5.95], [2.95, 8.0], null, 6.3),
    // Bedroom 2 less the column and its infill, x 2.95–3.55, z 2.75–3.00.
    room('bedroom2', 'Bedroom 2', [0.2, 2.95], [0.2, 4.05], 'wood', 12.7, {
      extra: [
        { x: [2.95, 3.55], z: [0.2, 2.75] },
        { x: [2.95, 3.55], z: [3.0, 4.05] },
      ],
    }),
    room('bedroom1', 'Bedroom 1', [0.2, 4.6], [4.15, 8.0], 'wood', 16.9),
  ],
  netArea: 43.1,

  // The slab has a hole exactly the void's outline; strips under the east and south walls stay so
  // the walls bear on it all round, and the last metre cantilevers over the street.
  slabs: [
    { x: [0, 4.7], z: [0, DEPTH] },
    { x: [4.7, WIDTH], z: [0, 2.95] },
    { x: [5.95, WIDTH], z: [2.95, DEPTH] },
    { x: [4.7, 5.95], z: [8.0, DEPTH] },
  ],

  clearZones: [
    clearZone('D6', [2.95, 4.25], [3.0, 3.9]),
    clearZone('D7', [3.65, 4.65], [3.45, 4.75]),
    clearZone('D11', [4.55, 5.45], [1.0, 2.3]),
  ],

  furniture: [
    piece('bed1', 'Double bed', 'bedding', [part(1.6, 2.0, 0.5, 1.85, 5.27)]),
    piece('headboard1', 'Headboard, bedroom 1', 'joinery', [part(1.7, 0.12, 0.5, 1.85, 4.21)], { touches: ['P7'] }),
    piece('nightstand1W', 'Nightstand, bedroom 1 west', 'joinery', [part(0.4, 0.4, 0.45, 0.8, 4.4)]),
    piece('nightstand1E', 'Nightstand, bedroom 1 east', 'joinery', [part(0.4, 0.4, 0.45, 2.9, 4.4)]),
    piece('wardrobe1', 'Wardrobe, bedroom 1', 'joinery', [part(0.6, 1.2, 2.1, 4.3, 6.2)], { touches: ['P4'] }),
    piece('bed2', 'Bed, bedroom 2', 'bedding', [part(1.4, 1.9, 0.5, 1.0, 2.98)]),
    piece('headboard2', 'Headboard, bedroom 2', 'joinery', [part(1.5, 0.12, 0.5, 1.0, 3.99)], { touches: ['P7'] }),
    piece('nightstand2', 'Nightstand, bedroom 2', 'joinery', [part(0.4, 0.4, 0.45, 1.95, 3.8)]),
    // Bedroom 2's wardrobe runs on to the column, so column and joinery read as one front.
    piece('wardrobe2', 'Wardrobe, bedroom 2', 'joinery', [part(0.6, 1.75, 2.1, 3.25, 1.875)], { touches: ['P5', 'C1', 'N1'] }),
    piece('desk2', 'Desk, bedroom 2', 'joinery', [part(0.9, 0.55, 0.74, 2.4, 0.475)], { touches: ['north'] }),
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
      part(0.6, 0.4, 0.12, 1.45, 4.55, 0.5),
      part(0.6, 0.4, 0.12, 2.25, 4.55, 0.5),
    ]),
    piece('throw1', 'Throw', 'upholstery', [part(1.6, 0.7, 0.04, 1.85, 5.85, 0.5)]),
    piece('pillow2', 'Pillow', 'fittings', [part(0.6, 0.4, 0.12, 1.0, 3.65, 0.5)]),
    piece('throw2', 'Throw', 'upholstery', [part(1.4, 0.6, 0.04, 1.0, 2.45, 0.5)]),
    piece('monitor', 'Monitor', 'appliance', [
      part(0.5, 0.03, 0.3, 2.4, 0.3, 0.85),
      part(0.06, 0.15, 0.11, 2.4, 0.35, 0.74),
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
    label('bedroom2', 'Bedroom 2', [1.8, 2.2], [-2.2, -0.2]),
    label('landing', 'Landing · stair arrival', [4.8, 2.4], [1.6, -0.6]),
    label('shower', 'Shower room · stack in the corner duct', [4.8, 0.9], [1.4, -1.6]),
    label('void', 'Stair void', [5.35, 5.5], [1.2, 0.8]),
  ],

  clearances: [
    clearance('wardrobe1Doors', 'Wardrobe, bedroom 1 (doors face west)', {
      axis: 'x',
      at: 4.0,
      direction: -1,
      span: [5.6, 6.8],
      ignore: ['wardrobe1'],
      expected: 1.35,
    }),
    clearance('wardrobe2Doors', 'Wardrobe, bedroom 2 (doors face west)', {
      axis: 'x',
      at: 2.95,
      direction: -1,
      span: [1.0, 2.75],
      ignore: ['wardrobe2'],
      expected: 1.25,
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
