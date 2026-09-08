// Part 4 — ground level, v3. The east wall is the party wall against the neighbouring house, so it
// carries no windows: the stair and the kitchen's tall run sit against it, and every room that needs
// light faces north, west or south. Across the back, a 2.05 m strip: a WC and laundry at the west
// end with the west window, then a galley kitchen behind a floor-to-ceiling sliding glass wall in
// black frames, three panels on a triple track that stack at the WC end; the kitchen turns the
// corner beside the stair into a pantry column. The living room takes the rest of the depth and runs on under the
// open steel flight, where the TV sits against the party wall. Bathing happens upstairs; the upper
// shower room's stack drops in a duct behind the kitchen's east run.
import { EXTERIOR_WALL_THICKNESS, FOOTPRINT, INTERIOR, PARTITION_THICKNESS, WALL_HEIGHT } from './global.js';
import { STAIR } from './stair.js';
import {
  clearZone,
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
    // The kitchen window over the worktop, from the wall cabinets to the corner.
    wall('north', 'x', 0.1, EXT, 0, WIDTH, [windowOf('Win2', 'kitchen', 3.6)], { exterior: true }),
    // Win5 sits over the approach to the stair, west of the starter leg; Win6 is the lower of the
    // stair pair, over the landing, in fixed laminated glass.
    wall('south', 'x', 7.1, EXT, 0, WIDTH, [
      door('D1', 0.6, 1.6, 2.1),
      windowOf('Win5', 'room', 2.3),
      windowOf('Win6', 'stair', 4.8),
    ], { exterior: true }),
    // Both west windows sit on the axes of the bedroom windows above them.
    wall('west', 'z', 0.1, EXT, INTERIOR.min, INTERIOR.zMax, [
      windowOf('Win3', 'high', 1.0),
      windowOf('Win4', 'room', 5.0),
    ], { exterior: true }),
    wall('east', 'z', 6.05, EXT, INTERIOR.min, INTERIOR.zMax, [], { exterior: true }),
    // P1 separates the WC and kitchen from the living room and stops at the stair partition. The WC
    // door sits at its west end; the whole kitchen stretch is the sliding glass wall, three
    // full-height panels: G1 and G3 are drawn closed, D3 is the middle panel slid open over G1.
    wall('P1', 'x', 2.3, PART, 0.2, 4.7, [
      door('D2', 0.4, 1.1, 2.05),
      windowOpening('G1', 1.85, 2.8, 0, WALL_HEIGHT),
      door('D3', 2.8, 3.75, WALL_HEIGHT, { leaf: false, frame: true }),
      windowOpening('G3', 3.75, 4.7, 0, WALL_HEIGHT),
    ]),
    wall('P2', 'z', 1.8, PART, 0.2, 2.25),
    // P3 is only a stub closing the kitchen's pantry corner; the steel flight beyond it stands open
    // to the living room behind its guard.
    wall('P3', 'z', 4.65, PART, 2.35, 2.95),
    // P6 backs the pantry corner, between it and the space under the flight.
    wall('P6', 'x', 2.9, PART, 4.7, 5.95),
  ],

  rooms: [
    room('wc', 'WC + laundry', [0.2, 1.75], [0.2, 2.25], 'tile', 3.2),
    room('kitchen', 'Kitchen', [1.85, 5.95], [0.2, 2.25], 'marble', 9.2, { extra: [{ x: [4.7, 5.95], z: [2.25, 2.85] }] }),
    room('living', 'Living / dining', [0.2, 4.6], [2.35, 7.0], 'marble', 20.7, { extra: [{ x: [4.6, 4.7], z: [2.95, 5.7] }] }),
    room('stair', 'Stair', [4.7, 5.95], [2.95, 7.0], 'marble', 5.1),
  ],
  netArea: 38.1,

  slabs: [{ x: [0, WIDTH], z: [0, DEPTH] }],

  clearZones: [
    clearZone('D1', [0.4, 1.8], [5.8, 7.0]),
    clearZone('D2', [0.3, 1.2], [1.75, 2.95]),
    clearZone('D3', [2.7, 3.85], [1.75, 2.95]),
    // A clear run-up in front of the starter leg's first riser.
    clearZone('stairFoot', [2.85, 3.89], [5.7, 7.0]),
  ],

  furniture: [
    // Dining for four beside the kitchen's glass wall, set west so a clear route runs round it; the
    // sofa under the west window and an armchair by the front door both face the TV, which stands
    // against the party wall under the high end of the open flight. A side table at the sofa's
    // street end, a sideboard under the front window, a console beside the WC door.
    piece('sofa', 'Sofa', 'upholstery', [part(0.85, 2.1, 0.8, 0.625, 4.4)], { touches: ['west'] }),
    piece('sideTable', 'Side table', 'joinery', [part(0.5, 0.5, 0.5, 1.4, 5.25)]),
    piece('armchair', 'Armchair', 'upholstery', [
      part(0.8, 0.8, 0.45, 2.2, 5.7),
      part(0.15, 0.8, 0.4, 1.875, 5.7, 0.45),
    ]),
    piece('sideboard', 'Sideboard', 'joinery', [part(1.0, 0.4, 0.85, 2.35, 6.8)], { touches: ['south'] }),
    piece('console', 'Console', 'joinery', [part(0.6, 0.3, 0.85, 1.55, 2.5)], { touches: ['P1'] }),
    piece('tvUnit', 'TV unit', 'joinery', [part(0.4, 1.3, 0.5, 5.75, 3.65)], { touches: ['east'] }),
    piece('diningTable', 'Dining table', 'joinery', [
      part(1.3, 0.8, 0.05, 2.6, 3.85, 0.7),
      part(0.07, 0.07, 0.7, 2.065, 3.565),
      part(0.07, 0.07, 0.7, 3.135, 3.565),
      part(0.07, 0.07, 0.7, 2.065, 4.135),
      part(0.07, 0.07, 0.7, 3.135, 4.135),
    ]),
    piece('chairW', 'Chair W', 'joinery', [
      part(0.45, 0.45, 0.45, 1.9, 3.85),
      part(0.08, 0.45, 0.45, 1.715, 3.85, 0.45),
    ]),
    piece('chairE', 'Chair E', 'joinery', [
      part(0.45, 0.45, 0.45, 3.3, 3.85),
      part(0.08, 0.45, 0.45, 3.485, 3.85, 0.45),
    ]),
    piece('chairN', 'Chair N', 'joinery', [
      part(0.45, 0.45, 0.45, 2.6, 3.2),
      part(0.45, 0.08, 0.45, 2.6, 3.015, 0.45),
    ]),
    piece('chairS', 'Chair S', 'joinery', [
      part(0.45, 0.45, 0.45, 2.6, 4.5),
      part(0.45, 0.08, 0.45, 2.6, 4.685, 0.45),
    ]),
    // Galley kitchen: fridge beside the WC partition, the north run under the windows, a short run
    // and a tall pantry column against the party wall, the column in the corner beside the stair.
    piece('fridge', 'Fridge', 'appliance', [part(0.6, 0.65, 1.8, 2.15, 0.525)], { touches: ['north', 'P2'] }),
    piece('northRun', 'Kitchen north run', 'fittings', [part(2.8, 0.6, 0.9, 3.95, 0.5)], { touches: ['north'] }),
    piece('eastRun', 'Kitchen east run', 'fittings', [part(0.6, 1.35, 0.9, 5.65, 1.475)], { touches: ['east'] }),
    piece('pantry', 'Pantry column', 'fittings', [part(0.6, 0.6, 2.1, 5.65, 2.5)], { touches: ['east'] }),
    piece('wallCabinets', 'Wall cabinets', 'fittings', [part(1.0, 0.35, 0.6, 3.1, 0.375, 1.5)], { touches: ['north'] }),
    // WC and laundry: machine in the north corner, hand basin on the partition, WC against the west
    // wall facing east, door at the south end.
    piece('washingMachine', 'Washing machine', 'fittings', [part(0.6, 0.6, 0.85, 0.5, 0.5)], { touches: ['north', 'west'] }),
    piece('basin', 'Hand basin', 'fittings', [part(0.35, 0.45, 0.85, 1.575, 1.025)], { touches: ['P2'] }),
    piece('wc', 'WC', 'fittings', [part(0.65, 0.42, 0.42, 0.525, 1.49)], { touches: ['west'] }),
  ],

  // Visual dressing only: rendered, never measured by the acceptance checks. Each piece stands on
  // spec furniture or the floor and stays out of every window prism.
  dressing: [
    piece('worktop', 'Worktop', 'structure', [
      part(2.8, 0.6, 0.04, 3.95, 0.5, 0.9),
      part(0.6, 1.35, 0.04, 5.65, 1.475, 0.9),
    ]),
    piece('hob', 'Hob', 'appliance', [part(0.58, 0.5, 0.01, 3.1, 0.5, 0.94)]),
    piece('sink', 'Sink', 'appliance', [
      part(0.5, 0.4, 0.01, 4.1, 0.5, 0.94),
      part(0.03, 0.03, 0.15, 4.1, 0.28, 0.94),
    ]),
    piece('tv', 'TV', 'appliance', [part(0.04, 1.1, 0.62, 5.59, 3.65, 0.5)]),
    piece('floorLamp', 'Floor lamp', 'appliance', [
      part(0.3, 0.3, 0.02, 0.5, 3.1),
      part(0.03, 0.03, 1.5, 0.5, 3.1, 0.02),
      part(0.35, 0.35, 0.25, 0.5, 3.1, 1.5),
    ]),
    // A plant under the flight, where the treads are still 1.40 m or more off the floor.
    piece('plant', 'Plant', 'joinery', [
      part(0.4, 0.4, 0.4, 5.1, 4.6),
      part(0.7, 0.7, 0.8, 5.1, 4.6, 0.4, { material: 'structure' }),
    ]),
    piece('cistern', 'Cistern', 'fittings', [part(0.15, 0.42, 0.4, 0.275, 1.49, 0.42)]),
    piece('doorD1', 'Front door leaf, open', 'joinery', [part(0.05, 1.0, 2.1, 0.625, 6.5)]),
    piece('doorD2', 'WC door leaf, open', 'joinery', [part(0.05, 0.7, 2.05, 1.125, 1.9)]),
    // The middle panel of the sliding wall, slid open on the kitchen side over the west panel.
    piece('slidingLeaf', 'Kitchen sliding glass panel, open', 'glazing', [
      part(0.95, 0.02, 2.55, 2.325, 2.18),
      part(0.05, 0.04, 2.55, 1.875, 2.18, 0, { material: 'frame' }),
      part(0.05, 0.04, 2.55, 2.775, 2.18, 0, { material: 'frame' }),
      part(0.95, 0.04, 0.05, 2.325, 2.18, 2.5, { material: 'frame' }),
      part(0.95, 0.04, 0.05, 2.325, 2.18, 0, { material: 'frame' }),
    ], { transparent: true }),
  ],

  // Offsets fan the pins outward; from the default south-east camera, north reads as up-right,
  // east as down-right, south as down-left and west as up-left.
  labels: [
    label('living', 'Living / dining', [2.5, 5.6], [-0.2, 2.0]),
    label('wc', 'WC + laundry · window', [0.95, 1.2], [-2.0, -0.8]),
    label('kitchen', 'Kitchen · sliding glass wall', [3.9, 1.3], [0.2, -1.8]),
    label('stair', 'Stair · steel flight, open beneath', [5.35, 5.0], [0.6, 1.9]),
    label('entrance', 'Main entrance door', [1.1, 7.05], [-1.8, 1.0]),
  ],

  clearances: [
    clearance('wcFront', 'WC, ground floor', {
      axis: 'x',
      at: 0.85,
      direction: 1,
      span: [1.28, 1.7],
      ignore: ['wc'],
      expected: 0.9,
    }),
    clearance('basinFront', 'Hand basin, ground floor', {
      axis: 'x',
      at: 1.4,
      direction: -1,
      span: [0.8, 1.25],
      ignore: ['basin'],
      expected: 1.2,
    }),
  ],

  visibilityTargets: [
    visibilityTarget('northRun', 100),
    visibilityTarget('fridge', 100),
    visibilityTarget('sofa', 100),
  ],
});
