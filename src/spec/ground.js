// Part 4 — ground level, v3. The east wall is the party wall against the neighbouring house, so it
// carries no windows: the stair and the kitchen's tall units sit against it, and every room that
// needs light faces north, west or south. The structural column C1 and its east–west beam set the
// plan, after the user's sketch. One wall on the column's line, as wide as the column, splits the
// back: the WC and laundry west of it, the kitchen east of it. The kitchen reaches forward to the
// beam line, where a solid wall closes it from the living room across the 1.50 m between the column
// and the flight, the user's choice, shutting it on cooking smells; it takes its daylight from the
// north window. It is entered under the top of the flight, through a door in the wall that backs
// the stair's arrival. The WC stops 1.65 m deep, so in front of it a hall opens off the living room
// for the WC door. The column is buried in the end of the column-line wall, and the beam rides on
// walls, the kitchen's included, except across the hall's mouth, where it reads as a lintel. The
// living room takes the front and runs on under the open steel flight; its TV hangs on the kitchen's
// front wall, the dining table stands under the west window. Bathing happens upstairs; the upper
// shower room's stack drops in a duct in the kitchen's north-east corner.
import { groundFront, groundWestSide } from './facades.js';
import { COLUMN, COLUMN_FRONT, EXTERIOR_WALL_THICKNESS, FOOTPRINT, INTERIOR, PARTITION_THICKNESS, SLAB_OPENING } from './global.js';
import { PARENTS_GARAGE } from './site.js';
import { STAIR } from './stair.js';
import {
  clearZone,
  column,
  columnPocket,
  clearance,
  door,
  extent,
  label,
  midpoint,
  part,
  piece,
  room,
  visibilityTarget,
  wall,
  windowOf,
} from './helpers.js';

const EXT = EXTERIOR_WALL_THICKNESS;
const PART = PARTITION_THICKNESS;
const { width: WIDTH, depth: DEPTH } = FOOTPRINT;

// The column-line wall is the column's own width, so it is flush with the column on both sides.
const COLUMN_LINE = midpoint(COLUMN.x);
const COLUMN_WIDTH = extent(COLUMN.x);
// The WC's south wall, which sets the hall's depth.
const WC_FRONT = 1.9;
const HALL_BACK = WC_FRONT + PARTITION_THICKNESS / 2;
// Where the starter leg's first riser stands: its treads end at the main flight's west face.
const STARTER_FOOT = STAIR.x[0] - (STAIR.starter.risers - 1) * STAIR.starter.going;
// The main flight's top riser stands on the slab opening's north edge.
const FLIGHT_TOP = SLAB_OPENING.z[0];
// The kitchen's front wall, under the beam, flush with the column's south face.
const KITCHEN_FRONT = COLUMN.z[1] - PART / 2;
// The kitchen door, in P6 under the top of the flight: its west jamb on P3, 0.90 m wide. Its
// approach under the flight runs 0.80 m south, as far as 2.00 m of headroom reaches.
const KITCHEN_DOOR = Object.freeze({ x: Object.freeze([STAIR.x[0], STAIR.x[0] + 0.9]), approach: 0.8 });
// The hall niche, recessed into the column-line wall from P1 to the column: what is left of the
// wall behind it is its 5 cm back, P8b.
const NICHE_BACK = 0.05;
const NICHE = Object.freeze({ x: [COLUMN.x[0], COLUMN.x[1] - NICHE_BACK], z: [HALL_BACK, COLUMN.z[0]] });

/** A part filling the niche's plan, `h` high from `y0`. */
function nichePart(h, y0 = 0) {
  return part(extent(NICHE.x), extent(NICHE.z), h, midpoint(NICHE.x), midpoint(NICHE.z), y0);
}

// The TV unit on the kitchen's front wall, centred between the column and P3.
const TV_UNIT = Object.freeze({ x: 3.95, length: 1.2, depth: 0.4 });
// The dining table's centre, its long side along the west wall, 0.40 m off it to clear the window's prism.
const DINING = Object.freeze({ x: 1.0, z: 5.2 });
const CHAIR = 0.45;

/** A dining chair: a seat centred at (x, z) with its back on the given side, away from the table. */
function diningChair(id, name, x, z, back) {
  const offset = (CHAIR - 0.08) / 2;
  const backPart = {
    north: part(CHAIR, 0.08, CHAIR, x, z - offset, CHAIR),
    south: part(CHAIR, 0.08, CHAIR, x, z + offset, CHAIR),
    east: part(0.08, CHAIR, CHAIR, x + offset, z, CHAIR),
  }[back];
  return piece(id, name, 'joinery', [part(CHAIR, CHAIR, CHAIR, x, z), backPart]);
}

// The street wall's window and door, shared with the street front dressed round them.
const STREET_WINDOW = windowOf('Win5', 'roomNarrow', 0.3);
const FRONT_DOOR = door('D1', 1.95, COLUMN_FRONT.x[0], 2.1);
const STREET_FRONT = groundFront({ window: STREET_WINDOW, door: FRONT_DOOR });
// The west wall's windows, shared with the side dressed round them on the house's own yard.
const WC_WINDOW = windowOf('Win3', 'high', 1.0);
const LIVING_WEST_WINDOW = windowOf('Win4', 'room', 4.7);

export const GROUND = Object.freeze({
  id: 'ground',
  name: 'Ground level',
  size: [WIDTH, DEPTH],
  stair: STAIR,
  // Presentation: caption outside the south-west corner and one dimension on the south edge; the
  // east edge faces the gap where the first level's pins sit.
  caption: [-1.4, 8.8],
  dimensionEdges: ['south'],
  ...STREET_FRONT,
  facadeDressing: { ...STREET_FRONT.facadeDressing, west: groundWestSide({ wc: WC_WINDOW, living: LIVING_WEST_WINDOW }) },
  neighbours: PARENTS_GARAGE,

  // North and south walls run the full footprint; west and east butt against them so no corner faces coincide.
  // Every window is one of the family's types (WINDOW_TYPES): the levels only choose where they start.
  walls: [
    // The kitchen window over the sink.
    wall('north', 'x', 0.1, EXT, 0, WIDTH, [windowOf('Win2', 'kitchen', 3.6)], { exterior: true }),
    // The street-wall column C2 sets the front: the front door stands against its west face, the
    // column its jamb, so the stair is under a metre past it and nobody crosses the living room;
    // the living room's street window takes the corner. Win6 is the stair slot over the landing.
    wall('south', 'x', 7.1, EXT, 0, WIDTH, [
      STREET_WINDOW,
      FRONT_DOOR,
      columnPocket(COLUMN_FRONT),
      windowOf('Win6', 'slot', 5.1),
    ], { exterior: true }),
    // Both west windows sit on the axes of the bedroom windows above them.
    wall('west', 'z', 0.1, EXT, INTERIOR.min, INTERIOR.zMax, [
      WC_WINDOW,
      LIVING_WEST_WINDOW,
    ], { exterior: true }),
    wall('east', 'z', 6.05, EXT, INTERIOR.min, INTERIOR.zMax, [], { exterior: true }),
    // P1 is the WC's south wall and the back of the hall, with the WC door at its east end.
    wall('P1', 'x', WC_FRONT, PART, 0.2, COLUMN.x[0], [door('D2', 2.05, 2.75, 2.05)]),
    // P8 runs on the column's line from the back wall to the WC's south wall, between the WC and the
    // kitchen; the kitchen is entered from the living room. Between P1 and the column the wall is
    // recessed into a floor-to-ceiling niche, the user's idea, holding the hall's shoe cabinet and
    // shelves flush with the wall face; P8b is the niche's 5 cm back, flush with the kitchen face.
    wall('P8', 'z', COLUMN_LINE, COLUMN_WIDTH, 0.2, HALL_BACK),
    wall('P8b', 'z', COLUMN.x[1] - NICHE_BACK / 2, NICHE_BACK, ...NICHE.z),
    column(COLUMN),
    // The street-wall column, in the street wall's line, so it is cut and drawn with that wall.
    column(COLUMN_FRONT, { exterior: true }),
    // P10 is the kitchen's front wall, solid from the column to the flight under the beam.
    wall('P10', 'x', KITCHEN_FRONT, PART, COLUMN.x[1], STAIR.x[0]),
    // P6 closes the kitchen at the flight's top, so the arrival above stands over the kitchen, and
    // carries its door; P3 closes the corner between it and P10.
    wall('P6', 'x', FLIGHT_TOP - PART / 2, PART, STAIR.x[0], 5.95, [door('D3', ...KITCHEN_DOOR.x, 2.05)]),
    wall('P3', 'z', STAIR.x[0] - PART / 2, PART, COLUMN.z[1], FLIGHT_TOP),
  ],

  rooms: [
    room('wc', 'WC + laundry', [0.2, 2.95], [0.2, 1.85], 'tile', 4.5),
    // The kitchen stops at P10, and beside the flight at P6, under the arrival.
    room('kitchen', 'Kitchen', [3.2, 5.95], [0.2, 2.85], 'marble', 7.7, {
      extra: [
        { x: [3.2, 4.7], z: [2.85, 2.9] },
        { x: [4.7, 5.95], z: [2.85, FLIGHT_TOP - PART] },
      ],
    }),
    // The living room's main rectangle, the hall in front of the WC, and the strip beside the flight.
    room('living', 'Living / dining', [0.2, 4.6], [3.0, 7.0], 'marble', 20.8, {
      extra: [
        { x: [0.2, 2.95], z: [1.95, 3.0] },
        { x: [4.6, 4.7], z: [FLIGHT_TOP, STAIR.landing.z[0]] },
      ],
    }),
    room('stair', 'Stair', [...STAIR.x], [FLIGHT_TOP, INTERIOR.zMax], 'marble', 4.8),
  ],
  netArea: 37.8,

  slabs: [{ x: [0, WIDTH], z: [0, DEPTH] }],

  clearZones: [
    // The column is the front door's east jamb, so the zone stops at it.
    clearZone('D1', [1.85, COLUMN_FRONT.x[0]], [5.8, 7.0]),
    clearZone('D2', [1.95, 2.85], [1.25, 2.45]),
    // The kitchen door's swing inside, and its approach under the flight.
    clearZone('D3', [...KITCHEN_DOOR.x], [2.3, FLIGHT_TOP + KITCHEN_DOOR.approach]),
    // A clear run-up in front of the starter leg's first riser, from the street-wall column.
    clearZone('stairFoot', [COLUMN_FRONT.x[1], STARTER_FOOT], [STAIR.landing.z[0], COLUMN_FRONT.z[0]]),
  ],

  furniture: [
    // The TV hangs on the kitchen's front wall and the sofa faces it from the middle of the room, the
    // 1.30 m between them the way to the kitchen door under the flight. Dining for four stands along
    // the west wall under the window, just clear of its prism, a chair at each end and two on the
    // east side; between those and the sofa a 0.95 m walk leads from the front door to the hall. A
    // sideboard under the street window.
    piece('tvUnit', 'TV unit', 'joinery', [part(TV_UNIT.length, TV_UNIT.depth, 0.5, TV_UNIT.x, KITCHEN_FRONT + PART / 2 + TV_UNIT.depth / 2)], { touches: ['P10'] }),
    piece('sofa', 'Sofa', 'upholstery', [part(1.8, 0.85, 0.8, 3.7, 5.1)]),
    piece('sideboard', 'Sideboard', 'joinery', [part(1.0, 0.4, 0.85, 1.05, 6.8)], { touches: ['south'] }),
    piece('diningTable', 'Dining table', 'joinery', [
      part(0.8, 1.2, 0.05, DINING.x, DINING.z, 0.7),
      ...[-1, 1].flatMap((dx) => [-1, 1].map((dz) => part(0.07, 0.07, 0.7, DINING.x + dx * 0.365, DINING.z + dz * 0.565))),
    ]),
    diningChair('chairN', 'Chair N', DINING.x, DINING.z - 0.825, 'north'),
    diningChair('chairS', 'Chair S', DINING.x, DINING.z + 0.825, 'south'),
    diningChair('chairE1', 'Chair E, north', DINING.x + 0.625, DINING.z - 0.3, 'east'),
    diningChair('chairE2', 'Chair E, south', DINING.x + 0.625, DINING.z + 0.3, 'east'),
    // L kitchen: the north run under the window from the column-line wall, a short run on the party
    // wall with the hob under the wall cabinets, and a tall wall on the column-line wall: the fridge
    // beside the north run and the pantry cabinet. The corner by the
    // stair is the door's.
    piece('northRun', 'Kitchen north run', 'fittings', [part(2.15, 0.6, 0.9, 4.275, 0.5)], { touches: ['north', 'P8'] }),
    piece('eastRun', 'Kitchen east run', 'fittings', [part(0.6, 1.35, 0.9, 5.65, 1.475)], { touches: ['east'] }),
    piece('fridge', 'Fridge', 'appliance', [part(0.6, 0.65, 1.8, 3.5, 1.175)], { touches: ['P8'] }),
    piece('wallCabinets', 'Wall cabinets', 'fittings', [part(0.35, 1.35, 0.6, 5.775, 1.475, 1.5)], { touches: ['east'] }),
    piece('tallCabinet', 'Tall cabinet', 'fittings', [part(0.5, 0.95, 2.1, 3.45, 2.025)], { touches: ['P8', 'P8b'] }),
    // WC and laundry: machine in the north-west corner, basin on the north wall, WC against the west
    // wall facing east under the high window, shelving in the north-east corner.
    piece('washingMachine', 'Washing machine', 'fittings', [part(0.6, 0.6, 0.85, 0.5, 0.5)], { touches: ['north', 'west'] }),
    piece('basin', 'Hand basin', 'fittings', [part(0.45, 0.35, 0.85, 1.3, 0.375)], { touches: ['north'] }),
    piece('wc', 'WC', 'fittings', [part(0.65, 0.42, 0.42, 0.525, 1.49)], { touches: ['west'] }),
    piece('shelves', 'Laundry shelving', 'joinery', [part(0.35, 0.8, 2.1, 2.775, 0.6)], { touches: ['north', 'P8'] }),
    // Built into the hall niche, flush with the wall face: a tilt-out shoe cabinet below and open
    // display shelves above, spanning from P1 to the column.
    piece('hallUnit', 'Hall shoe cabinet and display shelves', 'joinery', [
      nichePart(1.0),
      ...[1.4, 1.75, 2.1].map((y0) => nichePart(0.03, y0)),
    ], { touches: ['P1', 'P8', 'P8b', 'C1'] }),
  ],

  // Visual dressing only: rendered, never measured by the acceptance checks. Each piece stands on
  // spec furniture or the floor and stays out of every window prism.
  dressing: [
    piece('worktop', 'Worktop', 'structure', [
      part(2.15, 0.6, 0.04, 4.275, 0.5, 0.9),
      part(0.6, 1.35, 0.04, 5.65, 1.475, 0.9),
    ]),
    piece('hob', 'Hob', 'appliance', [part(0.5, 0.58, 0.01, 5.65, 1.3, 0.94)]),
    piece('sink', 'Sink', 'appliance', [
      part(0.5, 0.4, 0.01, 4.6, 0.5, 0.94),
      part(0.03, 0.03, 0.15, 4.6, 0.28, 0.94),
    ]),
    piece('tv', 'TV', 'appliance', [part(1.1, 0.04, 0.62, TV_UNIT.x, KITCHEN_FRONT + PART / 2 + 0.04, 0.5)]),
    // A plant under the flight, where the treads are still 1.40 m or more off the floor.
    piece('plant', 'Plant', 'joinery', [
      part(0.4, 0.4, 0.4, 5.1, 4.6),
      part(0.7, 0.7, 0.8, 5.1, 4.6, 0.4, { material: 'structure' }),
    ]),
    piece('floorLamp', 'Floor lamp', 'appliance', [
      part(0.3, 0.3, 0.02, 0.5, 3.25),
      part(0.03, 0.03, 1.5, 0.5, 3.25, 0.02),
      part(0.35, 0.35, 0.25, 0.5, 3.25, 1.5),
    ]),
    piece('cistern', 'Cistern', 'fittings', [part(0.15, 0.42, 0.4, 0.275, 1.49, 0.42)]),
    // The front door is hinged on its west jamb and opens back toward the sideboard.
    piece('doorD1', 'Front door leaf, open', 'woodSlat', [part(0.05, 1.0, 2.1, 1.975, 6.5)]),
    // The WC leaf opens inward, hinged on the east jamb, and folds against P8.
    piece('doorD2', 'WC door leaf, open', 'joinery', [part(0.05, 0.7, 2.05, 2.725, 1.5)]),
    // Pieces on the hall unit's display shelves.
    piece('hallDecor', 'Decor on the hall shelves', 'fittings', [
      part(0.12, 0.12, 0.25, 3.06, 2.15, 1.03),
      part(0.14, 0.3, 0.2, 3.06, 2.45, 1.43),
      part(0.1, 0.1, 0.18, 3.06, 2.2, 1.78),
    ]),
    // The kitchen door opens in, hinged on its east jamb, and parks against the kitchen's empty corner.
    piece('doorD3', 'Kitchen door leaf, open', 'joinery', [part(0.05, 0.9, 2.05, KITCHEN_DOOR.x[1] + 0.025, FLIGHT_TOP - PART - 0.45)]),
  ],

  // Offsets fan the pins outward; from the default south-east camera, north reads as up-right,
  // east as down-right, south as down-left and west as up-left.
  labels: [
    label('living', 'Living / dining', [2.5, 5.6], [-0.2, 2.0]),
    label('wc', 'WC + laundry · window', [1.2, 1.0], [-2.0, -0.8]),
    label('hall', 'Hall · WC door, shoe cabinet', [1.4, 2.5], [-2.2, 0.4]),
    label('kitchen', 'Kitchen · door under the stair', [4.3, 1.4], [0.2, -1.8]),
    label('stair', 'Stair · kitchen door beneath', [5.35, 5.0], [0.6, 1.9]),
    label('entrance', 'Main entrance door', [2.45, 7.05], [-1.8, 1.0]),
  ],

  clearances: [
    clearance('wcFront', 'WC, ground floor', {
      axis: 'x',
      at: 0.85,
      direction: 1,
      span: [1.28, 1.7],
      ignore: ['wc'],
      expected: 2.1,
    }),
    clearance('basinFront', 'Hand basin, ground floor', {
      axis: 'z',
      at: 0.55,
      direction: 1,
      span: [1.075, 1.525],
      ignore: ['basin'],
      expected: 1.3,
    }),
    clearance('shelvesFront', 'Laundry shelving (faces west)', {
      axis: 'x',
      at: 2.6,
      direction: -1,
      span: [0.2, 1.0],
      ignore: ['shelves'],
      expected: 1.075,
    }),
    clearance('tallCabinetFront', 'Tall cabinet, kitchen (doors face east)', {
      axis: 'x',
      at: 3.7,
      direction: 1,
      span: [1.55, 2.5],
      ignore: ['tallCabinet'],
      expected: 1.65,
    }),
  ],

  visibilityTargets: [
    visibilityTarget('northRun', 100),
    visibilityTarget('fridge', 100),
    // Mid-room, the sofa shows 88 % to the reference camera, the rest hidden by what stands nearer it.
    visibilityTarget('sofa', 88),
  ],
});
