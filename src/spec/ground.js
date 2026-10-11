// Part 4 — ground level, v3. The east wall is the party wall against the neighbouring house, so it
// carries no windows: the stair and the kitchen's tall units sit against it, and every room that
// needs light faces north, west or south. The structural column C1 and its east–west beam set the
// plan, after the user's sketch. One wall on the column's line, as wide as the column, splits the
// back: the WC and laundry west of it, the kitchen east of it. The kitchen reaches forward to the
// beam line, where a full-height black-framed glass wall closes it from the living room across the
// 1.50 m between the column and the flight: a fixed pane by the column and a 0.90 m sliding glass
// door by the flight, so the kitchen keeps the view and light of an open one but can be shut on
// cooking smells. The WC stops 1.65 m deep, so in front of it a hall opens off the living room for
// the WC door. The column is buried in the end of the column-line wall, and the beam rides on
// walls, the glass wall's head included, except across the hall's mouth, where it reads as a lintel. The
// living room takes the front and runs on under the open steel flight, where the TV sits against
// the party wall. Bathing happens upstairs; the upper shower room's stack drops in a duct in the
// kitchen's north-east corner.
import { COLUMN, EXTERIOR_WALL_THICKNESS, FOOTPRINT, INTERIOR, PARTITION_THICKNESS, WALL_HEIGHT } from './global.js';
import { STAIR } from './stair.js';
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
  windowOpening,
} from './helpers.js';

const EXT = EXTERIOR_WALL_THICKNESS;
const PART = PARTITION_THICKNESS;
const { width: WIDTH, depth: DEPTH } = FOOTPRINT;

// The column-line wall is the column's own width, so it is flush with the column on both sides.
const COLUMN_LINE = (COLUMN.x[0] + COLUMN.x[1]) / 2;
const COLUMN_WIDTH = COLUMN.x[1] - COLUMN.x[0];
// The WC's south wall, which sets the hall's depth.
const WC_FRONT = 1.9;
// The kitchen's glass wall, under the beam, flush with the column's south face.
const KITCHEN_FRONT = COLUMN.z[1] - PART / 2;
const GLASS_DOOR_WIDTH = 0.9;
// The back of the hall niche: what is left of the column-line wall behind a 0.20 m recess.
const NICHE_BACK = 0.05;

export const GROUND = Object.freeze({
  id: 'ground',
  name: 'Ground level',
  size: [WIDTH, DEPTH],
  stair: STAIR,
  // Presentation: caption outside the south-west corner and one dimension on the south edge; the
  // east edge faces the gap where the first level's pins sit.
  caption: [-1.4, 8.8],
  dimensionEdges: ['south'],

  // North and south walls run the full footprint; west and east butt against them so no corner faces coincide.
  // Every window is one of the family's types (WINDOW_TYPES): the levels only choose where they start.
  walls: [
    // The kitchen window over the sink.
    wall('north', 'x', 0.1, EXT, 0, WIDTH, [windowOf('Win2', 'kitchen', 3.6)], { exterior: true }),
    // The front door opens at the stair foot, the user's choice: the stair is reached without
    // crossing the living room and the kitchen opening lies straight ahead, while the living room's
    // street window takes the quiet corner. Win6 is the lower half of the stair slot, centred on
    // the landing.
    wall('south', 'x', 7.1, EXT, 0, WIDTH, [
      windowOf('Win5', 'room', 0.6),
      door('D1', 2.85, 3.85, 2.1),
      windowOf('Win6', 'slotLower', 5.1),
    ], { exterior: true }),
    // Both west windows sit on the axes of the bedroom windows above them.
    wall('west', 'z', 0.1, EXT, INTERIOR.min, INTERIOR.zMax, [
      windowOf('Win3', 'high', 1.0),
      windowOf('Win4', 'room', 4.7),
    ], { exterior: true }),
    wall('east', 'z', 6.05, EXT, INTERIOR.min, INTERIOR.zMax, [], { exterior: true }),
    // P1 is the WC's south wall and the back of the hall, with the WC door at its east end.
    wall('P1', 'x', WC_FRONT, PART, 0.2, COLUMN.x[0], [door('D2', 2.05, 2.75, 2.05)]),
    // P8 runs on the column's line from the back wall to the WC's south wall, between the WC and the
    // kitchen; the kitchen is entered from the living room. Between P1 and the column the wall is
    // recessed into a floor-to-ceiling niche, the user's idea, holding the hall's shoe cabinet and
    // shelves flush with the wall face; P8b is the niche's 5 cm back, flush with the kitchen face.
    wall('P8', 'z', COLUMN_LINE, COLUMN_WIDTH, 0.2, WC_FRONT + PART / 2),
    wall('P8b', 'z', COLUMN.x[1] - NICHE_BACK / 2, NICHE_BACK, WC_FRONT + PART / 2, COLUMN.z[0]),
    column(COLUMN),
    // P10 is the kitchen's glass wall, floor to beam with no sill or transom, the user's choice: G1
    // fixed by the column, D3 the sliding glass door by the flight, drawn slid open over G1.
    wall('P10', 'x', KITCHEN_FRONT, PART, COLUMN.x[1], STAIR.x[0], [
      windowOpening('G1', COLUMN.x[1], STAIR.x[0] - GLASS_DOOR_WIDTH, 0, WALL_HEIGHT),
      door('D3', STAIR.x[0] - GLASS_DOOR_WIDTH, STAIR.x[0], WALL_HEIGHT, { leaf: false, frame: true }),
    ]),
    // P6 backs the fridge corner, between it and the space under the flight.
    wall('P6', 'x', 2.9, PART, 4.7, 5.95),
  ],

  rooms: [
    room('wc', 'WC + laundry', [0.2, 2.95], [0.2, 1.85], 'tile', 4.5),
    // The kitchen stops at P6 beside the flight and at the glass wall west of it.
    room('kitchen', 'Kitchen', [3.2, 5.95], [0.2, 2.85], 'marble', 7.4, { extra: [{ x: [3.2, 4.7], z: [2.85, 2.9] }] }),
    // The living room's main rectangle, the hall in front of the WC, and the strip beside the flight.
    room('living', 'Living / dining', [0.2, 4.6], [3.0, 7.0], 'marble', 20.8, {
      extra: [
        { x: [0.2, 2.95], z: [1.95, 3.0] },
        { x: [4.6, 4.7], z: [3.0, 5.7] },
      ],
    }),
    room('stair', 'Stair', [4.7, 5.95], [2.95, 7.0], 'marble', 5.1),
  ],
  netArea: 37.7,

  slabs: [{ x: [0, WIDTH], z: [0, DEPTH] }],

  clearZones: [
    clearZone('D1', [2.75, 3.89], [5.8, 7.0]),
    clearZone('D2', [1.95, 2.85], [1.25, 2.45]),
    // The way into the kitchen through the sliding glass door.
    clearZone('kitchen', [3.8, 4.7], [2.3, 3.6]),
    // A clear run-up in front of the starter leg's first riser.
    clearZone('stairFoot', [2.85, 3.89], [5.7, 7.0]),
  ],

  furniture: [
    // Dining for four in the middle, set 0.90 m clear of the beam line so the hall and the kitchen
    // opening are reached along it from the front door; the sofa under the west window and an
    // armchair in the street corner face the TV, which stands against the party wall under the high
    // end of the open flight. A sideboard under the street window.
    piece('sofa', 'Sofa', 'upholstery', [part(0.85, 2.1, 0.8, 0.625, 4.6)], { touches: ['west'] }),
    piece('armchair', 'Armchair', 'upholstery', [
      part(0.8, 0.8, 0.45, 1.7, 6.15),
      part(0.15, 0.8, 0.4, 1.375, 6.15, 0.45),
    ]),
    piece('sideboard', 'Sideboard', 'joinery', [part(1.0, 0.4, 0.85, 1.85, 6.8)], { touches: ['south'] }),
    piece('tvUnit', 'TV unit', 'joinery', [part(0.4, 1.3, 0.5, 5.75, 3.65)], { touches: ['east'] }),
    // A 1.20 table placed so the walk past its chair E clears the first step's corner by 0.90 m, the
    // sofa keeps 0.50 m of legroom and the beam-line walk to the hall stays 0.90 m wide.
    piece('diningTable', 'Dining table', 'joinery', [
      part(1.2, 0.8, 0.05, 2.43, 4.775, 0.7),
      part(0.07, 0.07, 0.7, 1.945, 4.49),
      part(0.07, 0.07, 0.7, 2.915, 4.49),
      part(0.07, 0.07, 0.7, 1.945, 5.06),
      part(0.07, 0.07, 0.7, 2.915, 5.06),
    ]),
    piece('chairW', 'Chair W', 'joinery', [
      part(0.45, 0.45, 0.45, 1.78, 4.775),
      part(0.08, 0.45, 0.45, 1.595, 4.775, 0.45),
    ]),
    piece('chairE', 'Chair E', 'joinery', [
      part(0.45, 0.45, 0.45, 3.08, 4.775),
      part(0.08, 0.45, 0.45, 3.265, 4.775, 0.45),
    ]),
    piece('chairN', 'Chair N', 'joinery', [
      part(0.45, 0.45, 0.45, 2.43, 4.125),
      part(0.45, 0.08, 0.45, 2.43, 3.94, 0.45),
    ]),
    piece('chairS', 'Chair S', 'joinery', [
      part(0.45, 0.45, 0.45, 2.43, 5.425),
      part(0.45, 0.08, 0.45, 2.43, 5.61, 0.45),
    ]),
    // L kitchen: the north run under the window from the column-line wall, a short run on the party
    // wall with the hob under the wall cabinets, the fridge in the corner beside the stair, and a
    // tall pantry cabinet on the column-line wall, stopped short of the fixed pane.
    piece('northRun', 'Kitchen north run', 'fittings', [part(2.15, 0.6, 0.9, 4.275, 0.5)], { touches: ['north', 'P8'] }),
    piece('eastRun', 'Kitchen east run', 'fittings', [part(0.6, 1.35, 0.9, 5.65, 1.475)], { touches: ['east'] }),
    piece('fridge', 'Fridge', 'appliance', [part(0.65, 0.6, 1.8, 5.625, 2.5)], { touches: ['east'] }),
    piece('wallCabinets', 'Wall cabinets', 'fittings', [part(0.35, 1.35, 0.6, 5.775, 1.475, 1.5)], { touches: ['east'] }),
    piece('tallCabinet', 'Tall cabinet', 'fittings', [part(0.6, 0.95, 2.1, 3.5, 2.025)], { touches: ['P8', 'P8b'] }),
    // WC and laundry: machine in the north-west corner, basin on the north wall, WC against the west
    // wall facing east under the high window, shelving in the north-east corner.
    piece('washingMachine', 'Washing machine', 'fittings', [part(0.6, 0.6, 0.85, 0.5, 0.5)], { touches: ['north', 'west'] }),
    piece('basin', 'Hand basin', 'fittings', [part(0.45, 0.35, 0.85, 1.3, 0.375)], { touches: ['north'] }),
    piece('wc', 'WC', 'fittings', [part(0.65, 0.42, 0.42, 0.525, 1.49)], { touches: ['west'] }),
    piece('shelves', 'Laundry shelving', 'joinery', [part(0.35, 0.8, 2.1, 2.775, 0.6)], { touches: ['north', 'P8'] }),
    // Built into the hall niche, flush with the wall face: a tilt-out shoe cabinet below and open
    // display shelves above, spanning from P1 to the column.
    piece('hallUnit', 'Hall shoe cabinet and display shelves', 'joinery', [
      part(0.2, 0.8, 1.0, 3.05, 2.35),
      part(0.2, 0.8, 0.03, 3.05, 2.35, 1.4),
      part(0.2, 0.8, 0.03, 3.05, 2.35, 1.75),
      part(0.2, 0.8, 0.03, 3.05, 2.35, 2.1),
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
    piece('tv', 'TV', 'appliance', [part(0.04, 1.1, 0.62, 5.59, 3.65, 0.5)]),
    piece('floorLamp', 'Floor lamp', 'appliance', [
      part(0.3, 0.3, 0.02, 0.5, 3.25),
      part(0.03, 0.03, 1.5, 0.5, 3.25, 0.02),
      part(0.35, 0.35, 0.25, 0.5, 3.25, 1.5),
    ]),
    // A plant under the flight, where the treads are still 1.40 m or more off the floor.
    piece('plant', 'Plant', 'joinery', [
      part(0.4, 0.4, 0.4, 5.1, 4.6),
      part(0.7, 0.7, 0.8, 5.1, 4.6, 0.4, { material: 'structure' }),
    ]),
    piece('cistern', 'Cistern', 'fittings', [part(0.15, 0.42, 0.4, 0.275, 1.49, 0.42)]),
    // The front door is hinged on its west jamb, away from the starter steps.
    piece('doorD1', 'Front door leaf, open', 'joinery', [part(0.05, 1.0, 2.1, 2.875, 6.5)]),
    // The WC leaf opens inward, hinged on the east jamb, and folds against P8.
    piece('doorD2', 'WC door leaf, open', 'joinery', [part(0.05, 0.7, 2.05, 2.725, 1.5)]),
    // Pieces on the hall unit's display shelves.
    piece('hallDecor', 'Decor on the hall shelves', 'fittings', [
      part(0.12, 0.12, 0.25, 3.06, 2.15, 1.03),
      part(0.14, 0.3, 0.2, 3.06, 2.45, 1.43),
      part(0.1, 0.1, 0.18, 3.06, 2.2, 1.78),
    ]),
    // The glass door hangs from a track on the beam on the living side and parks slid open over the
    // fixed pane and the column's face.
    piece('slidingLeaf', 'Kitchen sliding glass door, open', 'glazing', [
      part(0.9, 0.02, 2.55, 3.35, 3.03),
      part(0.05, 0.04, 2.55, 2.925, 3.03, 0, { material: 'frame' }),
      part(0.05, 0.04, 2.55, 3.775, 3.03, 0, { material: 'frame' }),
      part(0.9, 0.04, 0.05, 3.35, 3.03, 2.5, { material: 'frame' }),
      part(0.9, 0.04, 0.05, 3.35, 3.03, 0, { material: 'frame' }),
    ], { transparent: true }),
  ],

  // Offsets fan the pins outward; from the default south-east camera, north reads as up-right,
  // east as down-right, south as down-left and west as up-left.
  labels: [
    label('living', 'Living / dining', [2.5, 5.6], [-0.2, 2.0]),
    label('wc', 'WC + laundry · window', [1.2, 1.0], [-2.0, -0.8]),
    label('hall', 'Hall · WC door, shoe cabinet', [1.4, 2.5], [-2.2, 0.4]),
    label('kitchen', 'Kitchen · sliding glass wall', [4.3, 1.4], [0.2, -1.8]),
    label('stair', 'Stair · steel flight, open beneath', [5.35, 5.0], [0.6, 1.9]),
    label('entrance', 'Main entrance door', [3.35, 7.05], [-1.8, 1.0]),
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
      at: 3.8,
      direction: 1,
      span: [1.55, 2.5],
      ignore: ['tallCabinet'],
      expected: 1.5,
    }),
  ],

  visibilityTargets: [
    visibilityTarget('northRun', 100),
    visibilityTarget('fridge', 100),
    visibilityTarget('sofa', 100),
  ],
});
