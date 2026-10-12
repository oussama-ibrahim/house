// The street front, from the owner's reference image: a beige box framed 0.30 m proud (a top band
// with a wood soffit and downlights, a bottom band at the slab, a west edge band), closed at the east
// end by a dark-marble pier with an LED line; inside the frame a lighter panel round the bedroom window
// and wood slats over the dressing wall. Downstairs: beige render, a lighter panel round the window, a
// wood door under a dark glass panel, two LED strips, marble planters and a marble entrance step.
// Coordinates follow the levels: x from the west edge, z southward (the ground level's street face at
// 7.20, the first level's at 8.20), y up from each level's floor; roof pieces take y from the roof
// slab's underside. Windows and the door are the levels' own openings, so the front follows the plan.
import { FOOTPRINT, SLAB_THICKNESS, UPPER_FOOTPRINT, WALL_HEIGHT } from './global.js';
import { block, extent, midpoint, piece } from './helpers.js';
import { ROOF } from './presentation.js';

const WIDTH = FOOTPRINT.width;
const GROUND_FACE = FOOTPRINT.depth;
const UPPER_FACE = UPPER_FOOTPRINT.depth;
// The roof slab plus the parapet, as roof front pieces measure it.
const ROOF_HEIGHT = ROOF.slabThickness + ROOF.parapetHeight;
const RENDER = 'beige';

// The frame round the upper box and the marble pier closing it at the east end.
const FRAME_OUT = 0.3;
/** The overhang's front line on the street: the frame's face, 0.30 m proud of the first level. */
export const FRONT_LINE = UPPER_FACE + FRAME_OUT;
const SIDE_BAND = 0.2;
const PIER_X = [5.55, WIDTH];
const LED_LINE = 0.02;
// Panels round the windows stand off the render; flush pieces are a skin on it.
const PANEL_OUT = 0.04;
const SKIN = 0.01;
const SLATS_X = [2.85, 5.45];
const DOOR_LED_X = Object.freeze([3.33, 3.5]);
const OVERHANG_DOWNLIGHT_X = Object.freeze([0.9, 2.45, 4.0, 5.3]);
// The overhang's downlights stand this far out from the ground level's street face.
const OVERHANG_DOWNLIGHT_OUT = 0.5;
const TOP_DOWNLIGHT_X = Object.freeze([1.0, 2.2, 3.6, 4.8]);
const DOWNLIGHT = 0.08;
// Marble planters: height, depth out from the face, and the planting's soil inside them.
const PLANTER_Y = Object.freeze([0, 0.4]);
const PLANTER = Object.freeze([0, 0.45]);
const SOIL = Object.freeze([0.08, 0.37]);

const span = (opening) => [opening.from, opening.to];
const rise = (opening) => [opening.sill, opening.head];
/** The range from `a` to `b` outward of a street face. */
const out = (face, [a, b]) => [face + a, face + b];

/**
 * A wall face to dress: it runs `along` the x or z axis, its outer plane is at `at`, and outward is
 * the `sign` direction across it. Pieces on it are given along the wall, up, and out from the plane.
 */
const faceOf = (along, at, sign) => Object.freeze({ along, at, sign });
const FACES = Object.freeze({
  groundStreet: faceOf('x', GROUND_FACE, 1),
  firstStreet: faceOf('x', UPPER_FACE, 1),
  // Both levels share the west wall's outer plane, the plot's west edge.
  west: faceOf('z', 0, -1),
});

/** A box on a face: `along` the wall, `y` up, `[a, b]` out from its plane. */
function onFace(face, along, y, [a, b], material) {
  const across = face.sign > 0 ? [face.at + a, face.at + b] : [face.at - b, face.at - a];
  return face.along === 'x' ? block(along, y, across, material) : block(across, y, along, material);
}

/** A full-height panel spanning `extentAlong` with a hole for `window`, standing off the face. */
function windowPanel(id, name, extentAlong, window, face) {
  const [left, right] = span(window);
  const [sill, head] = rise(window);
  const panel = (along, y) => onFace(face, along, y, [0, PANEL_OUT]);
  return piece(id, name, 'lightBeige', [
    panel([extentAlong[0], left], [0, WALL_HEIGHT]),
    panel([right, extentAlong[1]], [0, WALL_HEIGHT]),
    panel([left, right], [0, sill]),
    panel([left, right], [head, WALL_HEIGHT]),
  ]);
}

/** Vertical slats on a dark backing across `extentAlong`, full height, standing off the face. */
function slats(id, name, extentAlong, face) {
  const [width, gap, depth, backing] = [0.05, 0.04, 0.05, 0.02];
  const count = Math.floor((extent(extentAlong) + gap) / (width + gap));
  const start = extentAlong[0] + (extent(extentAlong) - (count * width + (count - 1) * gap)) / 2;
  const y = [0, WALL_HEIGHT];
  return piece(id, name, 'woodSlat', [
    onFace(face, extentAlong, y, [0, backing], 'joint'),
    ...Array.from({ length: count }, (_, i) => {
      const left = start + i * (width + gap);
      return onFace(face, [left, left + width], y, [backing, backing + depth], 'woodSlat');
    }),
  ]);
}

/** A wall light fixed on a slat panel, centred along it. */
function wallLight(id, extentAlong, face) {
  const centre = midpoint(extentAlong);
  return piece(id, 'Wall light on the slats', 'joint', [onFace(face, [centre - 0.04, centre + 0.04], [1.45, 1.6], [0.07, 0.12])]);
}

/** A vertical LED line flush on a face, floor to ceiling. */
function ledLine(along, face) {
  return onFace(face, [along, along + 0.03], [0, WALL_HEIGHT], [0, SKIN]);
}

/** A marble planter along a face, with its planting `plantHeight` above the floor. */
function planter(id, name, extentAlong, face, plantHeight) {
  return [
    piece(id, name, 'darkMarble', [onFace(face, extentAlong, PLANTER_Y, PLANTER)]),
    piece(`${id}Plants`, `${name}, planting`, 'leaf', [onFace(face, [extentAlong[0] + 0.1, extentAlong[1] - 0.1], [PLANTER_Y[1], plantHeight], SOIL)]),
  ];
}

/** Small light squares on a ceiling at height `y`, `distance` out from the face. */
function downlights(xs, y, face, distance) {
  const half = DOWNLIGHT / 2;
  return xs.map((x) => block([x - half, x + half], [y - SKIN, y], out(face, [distance - half, distance + half]), 'light'));
}

/** The ground level's street front, round its street window and front door. */
export function groundFront({ window, door }) {
  return {
    facade: RENDER,
    facadeDressing: {
      south: [
        windowPanel('windowPanel', 'Lighter panel round the window', [0.15, 1.9], window, FACES.groundStreet),
        piece('doorTop', 'Dark glass panel over the front door', 'joint', [block(span(door), [door.head, WALL_HEIGHT], out(GROUND_FACE, [0, SKIN]))]),
        piece('ledStrips', 'Two LED strips beside the door', 'light', DOOR_LED_X.map((x) => ledLine(x, FACES.groundStreet))),
        piece('planters', 'Marble planters', 'darkMarble', [
          block([0.15, 1.9], PLANTER_Y, out(GROUND_FACE, PLANTER)),
          block([5.6, 6.1], PLANTER_Y, out(GROUND_FACE, PLANTER)),
        ]),
        piece('plants', 'Planting', 'leaf', [
          block([0.25, 1.8], [PLANTER_Y[1], 0.85], out(GROUND_FACE, SOIL)),
          block([5.7, 6.0], [PLANTER_Y[1], 1.6], out(GROUND_FACE, SOIL)),
        ]),
        piece('step', 'Marble entrance step', 'darkMarble', [block([0, WIDTH], [-0.15, 0], [GROUND_FACE, UPPER_FACE - 0.2])]),
        piece('soffitLights', 'Downlights under the overhang', 'light', downlights(OVERHANG_DOWNLIGHT_X, WALL_HEIGHT, GROUND_FACE, OVERHANG_DOWNLIGHT_OUT)),
      ],
    },
  };
}

/** The first level's street front: the framed box round the bedroom window. */
export function firstFront({ window }) {
  const frame = out(UPPER_FACE, [0, FRAME_OUT]);
  return {
    facade: RENDER,
    slabEdge: RENDER,
    facadeDressing: {
      south: [
        piece('soffit', 'Soffit under the overhang', RENDER, [block([0, WIDTH], [-SLAB_THICKNESS - 2 * SKIN, -SLAB_THICKNESS], [GROUND_FACE, FRONT_LINE])]),
        piece('frame', 'Beige frame round the box', RENDER, [
          block([0, PIER_X[0]], [-SLAB_THICKNESS, 0], frame),
          block([0, SIDE_BAND], [0, WALL_HEIGHT], frame),
        ]),
        piece('pier', 'Dark marble pier', 'darkMarble', [block(PIER_X, [-SLAB_THICKNESS, WALL_HEIGHT], frame)]),
        piece('pierLed', 'LED line beside the pier', 'light', [block([PIER_X[0] - LED_LINE, PIER_X[0]], [0, WALL_HEIGHT], frame)]),
        windowPanel('windowPanel', 'Lighter panel round the bedroom window', [0.4, 2.7], window, FACES.firstStreet),
        slats('slats', 'Wood slats over the dressing wall', SLATS_X, FACES.firstStreet),
        wallLight('wallLight', SLATS_X, FACES.firstStreet),
      ],
    },
  };
}

/**
 * The parents' garage's street face, across `x`, in the front's language: a lighter panel round its
 * open `bay` (the lintel and the far jamb), downlights under its canopy in line with the overhang's,
 * and a marble planter at its far end, mirroring the house's.
 */
export function garageFront({ x, bay }) {
  const panel = out(GROUND_FACE, [0, PANEL_OUT]);
  const planter = out(GROUND_FACE, PLANTER.map((v) => v + PANEL_OUT));
  const soil = out(GROUND_FACE, SOIL.map((v) => v + PANEL_OUT));
  const planterX = [x[1] - 0.5, x[1]];
  return [
    piece('garageBayPanel', 'Lighter panel round the garage bay', 'lightBeige', [
      block(span(bay), [bay.head, WALL_HEIGHT], panel),
      block([bay.to, x[1]], [0, WALL_HEIGHT], panel),
    ]),
    piece('garageLights', 'Downlights under the garage canopy', 'light',
      downlights([x[0] + 0.75, x[1] - 0.75], WALL_HEIGHT, GROUND_FACE, OVERHANG_DOWNLIGHT_OUT)),
    piece('garagePlanter', 'Marble planter at the garage end', 'darkMarble', [block(planterX, PLANTER_Y, planter)]),
    piece('garagePlants', 'Planting at the garage end', 'leaf', [block([planterX[0] + 0.1, planterX[1] - 0.1], [PLANTER_Y[1], 1.4], soil)]),
  ];
}

/**
 * The ground level's west side, on the house's own yard, after the owner's second image: a lighter
 * panel round each window, the WC's high one included, a marble planter under the living room's
 * window, and an LED line near each corner.
 */
export function groundWestSide({ wc, living }) {
  return [
    windowPanel('westPanelWC', 'Lighter panel round the WC window', [wc.from - 0.25, wc.to + 0.25], wc, FACES.west),
    windowPanel('westPanelLiving', 'Lighter panel round the living room window', [living.from - 0.25, living.to + 0.25], living, FACES.west),
    ...planter('westPlanter', 'Marble planter along the west wall', [living.from - 0.25, living.to + 0.25], FACES.west, 0.85),
    piece('westLeds', 'LED lines near the west corners', 'light', [ledLine(0.35, FACES.west), ledLine(FOOTPRINT.depth - 0.25, FACES.west)]),
  ];
}

/**
 * The first level's west side: a lighter panel round each bedroom window, a narrow slat strip at
 * the back corner and a slat panel between bedroom 1's window and the street, each with a light.
 */
export function firstWestSide({ back, front }) {
  const backSlats = [0.08, back.from - 0.1];
  const frontSlats = [front.to + 0.35, UPPER_FACE - 0.25];
  return [
    slats('westSlatsBack', 'Wood slat strip at the back corner', backSlats, FACES.west),
    wallLight('westLightBack', backSlats, FACES.west),
    windowPanel('westPanelBedroom2', 'Lighter panel round bedroom 2 window', [back.from - 0.05, back.to + 0.25], back, FACES.west),
    windowPanel('westPanelBedroom1', 'Lighter panel round bedroom 1 west window', [front.from - 0.25, front.to + 0.25], front, FACES.west),
    slats('westSlatsFront', 'Wood slats toward the street corner', frontSlats, FACES.west),
    wallLight('westLightFront', frontSlats, FACES.west),
  ];
}

/** The roof's part of the front: the frame's top band with its wood soffit, and the pier, carried up. */
export const ROOF_FRONT = Object.freeze({
  walls: RENDER,
  coping: RENDER,
  front: Object.freeze([
    { id: 'topBand', x: [0, PIER_X[0]], y: [2 * SKIN, ROOF_HEIGHT], out: [0, FRAME_OUT], material: RENDER },
    { id: 'woodSoffit', x: [SIDE_BAND, PIER_X[0]], y: [0, 2 * SKIN], out: [0, FRAME_OUT], material: 'woodSlat' },
    { id: 'westBand', x: [0, SIDE_BAND], y: [0, 2 * SKIN], out: [0, FRAME_OUT], material: RENDER },
    { id: 'pier', x: PIER_X, y: [0, ROOF_HEIGHT], out: [0, FRAME_OUT], material: 'darkMarble' },
    { id: 'pierLed', x: [PIER_X[0] - LED_LINE, PIER_X[0]], y: [0, ROOF_HEIGHT], out: [0, FRAME_OUT], material: 'light' },
    ...TOP_DOWNLIGHT_X.map((x, i) => ({
      id: `downlight${i + 1}`,
      x: [x - DOWNLIGHT / 2, x + DOWNLIGHT / 2],
      y: [-SKIN, 0],
      out: [FRAME_OUT / 2 - DOWNLIGHT / 2, FRAME_OUT / 2 + DOWNLIGHT / 2],
      material: 'light',
    })),
  ]),
});
