// Part 4 — ground level, v3. The east wall is the party wall against the neighbouring house, so it
// carries no windows: the stair and the bathroom's blind side sit against it, and every room that
// needs light faces north, west or south. The kitchen is behind a floor-to-ceiling glazed screen
// in a black frame, with a sliding glass leaf beside a fixed opening.
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
  windowOpening,
} from './helpers.js';

const EXT = EXTERIOR_WALL_THICKNESS;
const PART = PARTITION_THICKNESS;

export const GROUND = Object.freeze({
  id: 'ground',
  name: 'Ground level',
  stair: STAIR,
  // Presentation: caption outside the south-west corner and one dimension on the south edge; the
  // east edge faces the gap where the first level's pins sit.
  caption: [-1.0, 7.3],
  dimensionEdges: ['south'],

  // North and south walls run the full footprint; west and east butt against them so no corner faces coincide.
  walls: [
    wall('north', 'x', 0.1, EXT, 0, FOOTPRINT, [
      windowOpening('Win2', 1.6, 2.6, 1.1, 2.2),
      windowOpening('Win1', 4.5, 5.3, 1.4, 2.2),
    ], { exterior: true }),
    wall('south', 'x', 5.9, EXT, 0, FOOTPRINT, [
      door('D1', 0.6, 1.6, 2.1),
      windowOpening('Win5', 3.1, 4.3, 0.9, 2.2),
      windowOpening('Win6', 4.8, 5.6, 1.2, 2.2),
    ], { exterior: true }),
    wall('west', 'z', 0.1, EXT, INTERIOR.min, INTERIOR.max, [
      windowOpening('Win3', 0.9, 1.7, 1.1, 2.2),
      windowOpening('Win4', 2.3, 3.3, 0.9, 2.2),
    ], { exterior: true }),
    wall('east', 'z', 5.9, EXT, INTERIOR.min, INTERIOR.max, [], { exterior: true }),
    // P1 separates the kitchen and bathroom from the living room. Its kitchen stretch is a glazed
    // screen to the ceiling (G1) beside a leafless opening (D3) that the sliding leaf serves.
    wall('P1', 'x', 2.0, PART, 0.2, 5.8, [
      windowOpening('G1', 0.9, 2.3, 0, WALL_HEIGHT, { transom: 2.1 }),
      door('D3', 2.4, 3.3, 2.05, { leaf: false, frame: true }),
      door('D2', 3.6, 4.4, 2.05),
    ]),
    wall('P2', 'z', 3.45, PART, 0.2, 1.95),
    // P3 carries the stair opening at the bottom of the flight and, at the top end, the low door of
    // the store under the upper treads.
    wall('P3', 'z', 4.5, PART, 2.05, 5.8, [
      door('D9', 2.1, 2.8, 1.9),
      door('D4', 4.8, 5.8, 2.2, { leaf: false }),
    ]),
  ],

  rooms: [
    room('kitchen', 'Kitchen', [0.2, 3.4], [0.2, 1.95], 'marble', 5.6),
    room('bathroom', 'Bathroom + laundry', [3.5, 5.8], [0.2, 1.95], 'tile', 4.0),
    room('living', 'Living / dining', [0.2, 4.45], [2.05, 5.8], 'marble', 15.9),
    room('stair', 'Stair', [4.55, 5.8], [2.05, 5.8], 'tile', 4.7),
  ],
  netArea: 30.2,

  slabs: [{ x: [0, FOOTPRINT], z: [0, FOOTPRINT] }],

  clearZones: [
    clearZone('D1', [0.4, 1.8], [4.6, 5.8]),
    clearZone('D2', [3.5, 4.5], [1.45, 2.65]),
    clearZone('D3', [2.3, 3.4], [1.45, 2.65]),
    clearZone('D4', [3.9, 4.55], [4.8, 5.8]),
    clearZone('D9', [3.8, 4.55], [2.0, 2.9]),
  ],

  // The store under the upper treads: reached through D9, usable where the soffit is above 1.20 m.
  understair: { x: [4.55, 5.8], z: [2.05, 3.8], door: 'D9' },

  furniture: [
    // Sofa under the west window facing the TV on the stair wall; dining beside the kitchen screen.
    piece('sofa', 'Sofa', 'upholstery', [part(0.85, 2.1, 0.8, 0.625, 3.5)], { touches: ['west'] }),
    piece('coffeeTable', 'Coffee table', 'joinery', [part(0.9, 0.55, 0.38, 1.8, 3.95)]),
    piece('tvUnit', 'TV unit', 'joinery', [part(0.4, 1.3, 0.5, 4.25, 3.6)], { touches: ['P3'] }),
    piece('diningTable', 'Dining table', 'joinery', [
      part(1.3, 0.8, 0.05, 2.8, 3.1, 0.7),
      part(0.07, 0.07, 0.7, 2.265, 2.815),
      part(0.07, 0.07, 0.7, 3.335, 2.815),
      part(0.07, 0.07, 0.7, 2.265, 3.385),
      part(0.07, 0.07, 0.7, 3.335, 3.385),
    ]),
    piece('chairW', 'Chair W', 'joinery', [
      part(0.45, 0.45, 0.45, 2.1, 3.1),
      part(0.08, 0.45, 0.45, 1.915, 3.1, 0.45),
    ]),
    piece('chairE', 'Chair E', 'joinery', [
      part(0.45, 0.45, 0.45, 3.5, 3.1),
      part(0.08, 0.45, 0.45, 3.685, 3.1, 0.45),
    ]),
    piece('chairS', 'Chair S', 'joinery', [
      part(0.45, 0.45, 0.45, 2.8, 3.75),
      part(0.45, 0.08, 0.45, 2.8, 3.935, 0.45),
    ]),
    // L-shaped kitchen in the north-west corner, fridge at the free end of the north run.
    piece('baseRun', 'Kitchen base run', 'fittings', [part(2.35, 0.6, 0.9, 1.375, 0.5)], { touches: ['north', 'west'] }),
    piece('returnRun', 'Kitchen return run', 'fittings', [part(0.6, 1.1, 0.9, 0.5, 1.35)], { touches: ['west'] }),
    piece('wallCabinets', 'Wall cabinets', 'fittings', [part(0.8, 0.35, 0.6, 1.2, 0.375, 1.5)], { touches: ['north'] }),
    piece('fridge', 'Fridge', 'appliance', [part(0.6, 0.65, 1.8, 2.95, 0.575)]),
    piece('showerTray', 'Shower tray', 'fittings', [part(0.9, 0.9, 0.08, 3.95, 0.65)], { touches: ['north', 'P2'] }),
    piece('screenE', 'Shower screen, east panel', 'glazing', [part(0.02, 0.9, 1.9, 4.39, 0.65, 0.08)], {
      touches: ['north'],
      transparent: true,
    }),
    piece('screenS', 'Shower screen, south panel', 'glazing', [part(0.4, 0.02, 1.9, 4.2, 1.09, 0.08)], {
      transparent: true,
    }),
    piece('basin', 'Basin', 'fittings', [part(0.6, 0.4, 0.85, 4.85, 0.4)], { touches: ['north'] }),
    piece('wc', 'WC', 'fittings', [part(0.42, 0.65, 0.42, 5.54, 0.925)]),
    piece('washingMachine', 'Washing machine', 'fittings', [part(0.6, 0.6, 0.85, 5.45, 1.6)]),
  ],

  // Visual dressing only: rendered, never measured by the acceptance checks. Each piece stands on
  // spec furniture or the floor and stays out of every window prism.
  dressing: [
    piece('worktop', 'Worktop', 'structure', [
      part(2.35, 0.6, 0.04, 1.375, 0.5, 0.9),
      part(0.6, 1.1, 0.04, 0.5, 1.35, 0.9),
    ]),
    piece('hob', 'Hob', 'appliance', [part(0.58, 0.5, 0.01, 1.2, 0.5, 0.94)]),
    piece('sink', 'Sink', 'appliance', [
      part(0.5, 0.4, 0.01, 2.1, 0.5, 0.94),
      part(0.03, 0.03, 0.15, 2.1, 0.28, 0.94),
    ]),
    piece('tv', 'TV', 'appliance', [part(0.04, 1.1, 0.62, 4.41, 3.6, 0.5)]),
    piece('cistern', 'Cistern', 'fittings', [part(0.15, 0.42, 0.4, 5.675, 0.925, 0.42)]),
    piece('doorD1', 'Front door leaf, open', 'joinery', [part(0.05, 1.0, 2.1, 0.625, 5.3)]),
    piece('doorD2', 'Bathroom door leaf, open', 'joinery', [part(0.05, 0.8, 2.05, 3.625, 1.55)]),
    piece('doorD9', 'Store door leaf, open', 'joinery', [part(0.7, 0.05, 1.9, 4.1, 2.125)]),
    // Shelving against the party wall inside the store, under treads whose soffit is 1.40 m or higher.
    piece('storeShelves', 'Store shelving', 'joinery', [
      part(0.03, 1.2, 1.18, 5.365, 2.7),
      part(0.03, 1.2, 1.18, 5.735, 2.7),
      part(0.4, 1.2, 0.03, 5.55, 2.7, 0.35),
      part(0.4, 1.2, 0.03, 5.55, 2.7, 0.75),
      part(0.4, 1.2, 0.03, 5.55, 2.7, 1.15),
    ]),
    // The sliding leaf stands open on the kitchen side, over the fixed pane next to the opening.
    piece('slidingLeaf', 'Kitchen sliding glass leaf, open', 'glazing', [
      part(0.9, 0.02, 2.05, 1.85, 1.88),
      part(0.05, 0.04, 2.05, 1.425, 1.88, 0, { material: 'frame' }),
      part(0.05, 0.04, 2.05, 2.275, 1.88, 0, { material: 'frame' }),
      part(0.9, 0.04, 0.05, 1.85, 1.88, 2.0, { material: 'frame' }),
      part(0.9, 0.04, 0.05, 1.85, 1.88, 0, { material: 'frame' }),
    ], { transparent: true }),
  ],

  // Offsets fan the pins outward; from the default south-east camera, north reads as up-right,
  // east as down-right, south as down-left and west as up-left.
  labels: [
    label('living', 'Living / dining', [2.5, 4.4], [-0.2, 2.0]),
    label('kitchen', 'Kitchen · glazed screen', [1.8, 1.1], [-1.6, -1.2]),
    label('bathroom', 'Bathroom + laundry · window', [4.7, 1.1], [1.4, -1.2]),
    label('stair', 'Stair · store beneath', [5.2, 4.2], [0.6, 1.9]),
    label('entrance', 'Main entrance door', [1.1, 5.85], [-1.8, 1.0]),
  ],

  clearances: [
    clearance('showerEntry', 'Shower entry', {
      axis: 'z',
      at: 1.1,
      direction: 1,
      span: [3.5, 4.0],
      ignore: ['showerTray', 'screenS', 'screenE'],
      expected: 0.85,
    }),
    clearance('wcFront', 'WC, ground bathroom', {
      axis: 'x',
      at: 5.33,
      direction: -1,
      span: [0.6, 1.25],
      ignore: ['wc'],
      expected: 0.93,
    }),
  ],

  visibilityTargets: [
    visibilityTarget('baseRun', 80),
    visibilityTarget('fridge', 100),
    visibilityTarget('sofa', 100),
  ],
});
