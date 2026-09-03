// Part 5 — first level, v3. Two bedrooms off a small hall. The stair arrives at the north-east into
// the hall, which wraps south along the party wall to bedroom 1's door; bedroom 2 opens off its west
// side. The east wall is free of the neighbour at this level, so the hall takes a window there.
import { EXTERIOR_WALL_THICKNESS, FOOTPRINT, INTERIOR, PARTITION_THICKNESS } from './global.js';
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

export const FIRST = Object.freeze({
  id: 'first',
  name: 'First level',
  stair: null,
  // Presentation: caption outside the north-east corner and dimensions on the two edges nearest the
  // south-east camera.
  caption: [7.1, -0.2],
  dimensionEdges: ['south', 'east'],

  walls: [
    wall('north', 'x', 0.1, EXT, 0, FOOTPRINT, [
      windowOpening('Win7', 0.4, 2.0, 0.9, 2.2),
      windowOpening('Win9', 3.9, 5.3, 1.2, 2.2),
    ], { exterior: true }),
    wall('south', 'x', 5.9, EXT, 0, FOOTPRINT, [
      windowOpening('Win12', 0.5, 1.9, 0.9, 2.2),
      windowOpening('Win11', 3.1, 4.1, 0.9, 2.2),
    ], { exterior: true }),
    wall('west', 'z', 0.1, EXT, INTERIOR.min, INTERIOR.max, [
      windowOpening('Win8', 0.8, 2.0, 0.9, 2.2),
      windowOpening('Win14', 3.5, 4.7, 0.9, 2.2),
    ], { exterior: true }),
    wall('east', 'z', 5.9, EXT, INTERIOR.min, INTERIOR.max, [
      windowOpening('Win13', 0.6, 1.6, 1.2, 2.2),
    ], { exterior: true }),
    // P4 guards the stair void only; north of it the hall is open to the stair arrival.
    wall('P4', 'z', 4.5, PART, 2.05, 5.8),
    wall('P5', 'z', 3.5, PART, 0.2, 2.95, [door('D6', 0.6, 1.4, 2.05)]),
    wall('P7', 'x', 3.0, PART, 0.2, 4.45, [door('D7', 3.6, 4.4, 2.05)]),
  ],

  rooms: [
    room('hall', 'Hall', [3.55, 5.8], [0.2, 2.05], 'marble', 5.0, { extra: [{ x: [3.55, 4.45], z: [2.05, 2.95] }] }),
    room('void', 'Stair void', [4.55, 5.8], [2.05, 5.8], null, 4.7),
    room('bedroom2', 'Bedroom 2', [0.2, 3.45], [0.2, 2.95], 'wood', 8.9),
    room('bedroom1', 'Bedroom 1', [0.2, 4.45], [3.05, 5.8], 'wood', 11.7),
  ],
  netArea: 30.3,

  // The slab has a hole at the stair void.
  slabs: [
    { x: [0, 4.55], z: [0, FOOTPRINT] },
    { x: [4.55, FOOTPRINT], z: [0, 2.05] },
  ],

  clearZones: [
    clearZone('D6', [2.85, 4.15], [0.5, 1.5]),
    clearZone('D7', [3.5, 4.5], [2.35, 3.65]),
  ],

  furniture: [
    piece('bed1', 'Double bed', 'bedding', [part(1.6, 2.0, 0.5, 1.85, 4.17)]),
    piece('headboard1', 'Headboard, bedroom 1', 'joinery', [part(1.7, 0.12, 0.5, 1.85, 3.11)], { touches: ['P7'] }),
    piece('nightstand1W', 'Nightstand, bedroom 1 west', 'joinery', [part(0.4, 0.4, 0.45, 0.8, 3.3)]),
    piece('nightstand1E', 'Nightstand, bedroom 1 east', 'joinery', [part(0.4, 0.4, 0.45, 2.9, 3.3)]),
    piece('wardrobe1', 'Wardrobe, bedroom 1', 'joinery', [part(0.6, 1.2, 2.1, 4.15, 4.8)], { touches: ['P4'] }),
    piece('bed2', 'Bed, bedroom 2', 'bedding', [part(1.4, 1.9, 0.5, 1.0, 1.88)]),
    piece('headboard2', 'Headboard, bedroom 2', 'joinery', [part(1.5, 0.12, 0.5, 1.0, 2.89)], { touches: ['P7'] }),
    piece('nightstand2', 'Nightstand, bedroom 2', 'joinery', [part(0.4, 0.4, 0.45, 1.95, 2.7)]),
    piece('wardrobe2', 'Wardrobe, bedroom 2', 'joinery', [part(0.6, 1.2, 2.1, 3.15, 2.3)], { touches: ['P5'] }),
    piece('desk2', 'Desk, bedroom 2', 'joinery', [part(0.9, 0.55, 0.74, 2.4, 0.475)], { touches: ['north'] }),
  ],

  // Visual dressing only: rendered, never measured by the acceptance checks.
  dressing: [
    piece('pillows1', 'Pillows', 'fittings', [
      part(0.6, 0.4, 0.12, 1.45, 3.45, 0.5),
      part(0.6, 0.4, 0.12, 2.25, 3.45, 0.5),
    ]),
    piece('throw1', 'Throw', 'upholstery', [part(1.6, 0.7, 0.04, 1.85, 4.75, 0.5)]),
    piece('pillow2', 'Pillow', 'fittings', [part(0.6, 0.4, 0.12, 1.0, 2.55, 0.5)]),
    piece('throw2', 'Throw', 'upholstery', [part(1.4, 0.6, 0.04, 1.0, 1.35, 0.5)]),
    piece('monitor', 'Monitor', 'appliance', [
      part(0.5, 0.03, 0.3, 2.4, 0.3, 0.85),
      part(0.06, 0.15, 0.11, 2.4, 0.35, 0.74),
    ]),
    // Hinged on the south jamb so the open leaf lies along the wardrobe side, clear of the desk.
    piece('doorD6', 'Bedroom 2 door leaf, open', 'joinery', [part(0.8, 0.05, 2.05, 3.05, 1.425)]),
    piece('doorD7', 'Bedroom 1 door leaf, open', 'joinery', [part(0.05, 0.8, 2.05, 3.625, 3.45)]),
  ],

  // Offsets fan the pins outward; from the default south-east camera, north reads as up-right,
  // east as down-right, south as down-left and west as up-left. The ground level sits up-left of
  // this one, so nothing points that way.
  labels: [
    label('bedroom1', 'Bedroom 1 · master', [2.3, 4.5], [0.6, 2.2]),
    label('bedroom2', 'Bedroom 2', [1.8, 1.6], [-2.2, -0.2]),
    label('hall', 'Hall · stair arrival', [4.7, 1.1], [1.5, -1.4]),
    label('void', 'Stair void', [5.2, 4.0], [0.9, 1.2]),
  ],

  clearances: [
    clearance('wardrobe1Doors', 'Wardrobe, bedroom 1 (doors face west)', {
      axis: 'x',
      at: 3.85,
      direction: -1,
      span: [4.2, 5.4],
      ignore: ['wardrobe1'],
      expected: 1.2,
    }),
    clearance('wardrobe2Doors', 'Wardrobe, bedroom 2 (doors face west)', {
      axis: 'x',
      at: 2.85,
      direction: -1,
      span: [1.7, 2.9],
      ignore: ['wardrobe2'],
      expected: 0.7,
    }),
  ],

  visibilityTargets: [
    visibilityTarget('bed1', 100),
    visibilityTarget('bed2', 80),
    visibilityTarget('desk2', 100),
  ],
});
