// The street front, from the owner's reference image: a beige box framed 0.30 m proud (a top band
// with a wood soffit and downlights, a bottom band at the slab, a west edge band), closed at the east
// end by a dark-marble pier with an LED line; inside the frame a lighter panel round the bedroom window
// and wood slats over the dressing wall. Downstairs: beige render, a lighter panel round the window, a
// wood door under a dark glass panel, two LED strips, marble planters and a marble entrance step.
// Coordinates follow the levels: x from the west edge, z southward (the ground level's street face at
// 7.20, the first level's at 8.20), y up from each level's floor; roof pieces take y from the roof
// slab's underside. Windows and the door are the levels' own openings, so the front follows the plan.
import { FOOTPRINT, SLAB_THICKNESS, UPPER_FOOTPRINT, WALL_HEIGHT } from './global.js';
import { extent, midpoint, part, piece } from './helpers.js';
import { ROOF } from './presentation.js';

const WIDTH = FOOTPRINT.width;
const GROUND_FACE = FOOTPRINT.depth;
const UPPER_FACE = UPPER_FOOTPRINT.depth;
// The roof slab plus the parapet, as roof front pieces measure it.
const ROOF_HEIGHT = ROOF.slabThickness + ROOF.parapetHeight;
const RENDER = 'beige';

// The frame round the upper box and the marble pier closing it at the east end.
const FRAME_OUT = 0.3;
const SIDE_BAND = 0.2;
const PIER_X = [5.55, WIDTH];
const LED_LINE = 0.02;
// Panels round the windows stand off the render; flush pieces are a skin on it.
const PANEL_OUT = 0.04;
const SKIN = 0.01;
const SLATS_X = [2.85, 5.45];
const DOOR_LED_X = Object.freeze([3.33, 3.5]);
const OVERHANG_DOWNLIGHT_X = Object.freeze([0.9, 2.45, 4.0, 5.3]);
const TOP_DOWNLIGHT_X = Object.freeze([1.0, 2.2, 3.6, 4.8]);
const DOWNLIGHT = 0.08;

const span = (opening) => [opening.from, opening.to];
const rise = (opening) => [opening.sill, opening.head];
/** The range from `a` to `b` outward of a street face. */
const out = (face, [a, b]) => [face + a, face + b];

/** One box over three ranges, as a part of a piece. */
function block(x, y, z, material) {
  return part(extent(x), extent(z), extent(y), midpoint(x), midpoint(z), y[0], { material });
}

/** A full-height panel spanning `x` with a hole for `window`, standing off the face. */
function windowPanel(name, x, window, face) {
  const z = out(face, [0, PANEL_OUT]);
  const [left, right] = span(window);
  const [sill, head] = rise(window);
  return piece('windowPanel', name, 'lightBeige', [
    block([x[0], left], [0, WALL_HEIGHT], z),
    block([right, x[1]], [0, WALL_HEIGHT], z),
    block([left, right], [0, sill], z),
    block([left, right], [head, WALL_HEIGHT], z),
  ]);
}

/** Vertical slats on a dark backing across `x`, full height, standing off `face`. */
function slats(x, face) {
  const [width, gap, depth, backing] = [0.05, 0.04, 0.05, 0.02];
  const count = Math.floor((extent(x) + gap) / (width + gap));
  const start = x[0] + (extent(x) - (count * width + (count - 1) * gap)) / 2;
  const y = [0, WALL_HEIGHT];
  return piece('slats', 'Wood slats over the dressing wall', 'woodSlat', [
    block(x, y, out(face, [0, backing]), 'joint'),
    ...Array.from({ length: count }, (_, i) => {
      const left = start + i * (width + gap);
      return block([left, left + width], y, out(face, [backing, backing + depth]), 'woodSlat');
    }),
  ]);
}

/** Small light squares on a ceiling at height `y`, `distance` out from the face. */
function downlights(xs, y, face, distance) {
  const half = DOWNLIGHT / 2;
  return xs.map((x) => block([x - half, x + half], [y - SKIN, y], out(face, [distance - half, distance + half]), 'light'));
}

/** The ground level's street front, round its street window and front door. */
export function groundFront({ window, door }) {
  const planter = [0, 0.45];
  const soil = [0.08, 0.37];
  return {
    facade: RENDER,
    facadeDressing: {
      south: [
        windowPanel('Lighter panel round the window', [0.15, 1.9], window, GROUND_FACE),
        piece('doorTop', 'Dark glass panel over the front door', 'joint', [block(span(door), [door.head, WALL_HEIGHT], out(GROUND_FACE, [0, SKIN]))]),
        piece('ledStrips', 'Two LED strips beside the door', 'light',
          DOOR_LED_X.map((x) => block([x, x + 0.03], [0, WALL_HEIGHT], out(GROUND_FACE, [0, SKIN])))),
        piece('planters', 'Marble planters', 'darkMarble', [
          block([0.15, 1.9], [0, 0.4], out(GROUND_FACE, planter)),
          block([5.6, 6.1], [0, 0.4], out(GROUND_FACE, planter)),
        ]),
        piece('plants', 'Planting', 'leaf', [
          block([0.25, 1.8], [0.4, 0.85], out(GROUND_FACE, soil)),
          block([5.7, 6.0], [0.4, 1.6], out(GROUND_FACE, soil)),
        ]),
        piece('step', 'Marble entrance step', 'darkMarble', [block([0, WIDTH], [-0.15, 0], [GROUND_FACE, UPPER_FACE - 0.2])]),
        piece('soffitLights', 'Downlights under the overhang', 'light', downlights(OVERHANG_DOWNLIGHT_X, WALL_HEIGHT, GROUND_FACE, 0.5)),
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
        piece('soffit', 'Soffit under the overhang', RENDER, [block([0, WIDTH], [-SLAB_THICKNESS - 2 * SKIN, -SLAB_THICKNESS], [GROUND_FACE, UPPER_FACE + FRAME_OUT])]),
        piece('frame', 'Beige frame round the box', RENDER, [
          block([0, PIER_X[0]], [-SLAB_THICKNESS, 0], frame),
          block([0, SIDE_BAND], [0, WALL_HEIGHT], frame),
        ]),
        piece('pier', 'Dark marble pier', 'darkMarble', [block(PIER_X, [-SLAB_THICKNESS, WALL_HEIGHT], frame)]),
        piece('pierLed', 'LED line beside the pier', 'light', [block([PIER_X[0] - LED_LINE, PIER_X[0]], [0, WALL_HEIGHT], frame)]),
        windowPanel('Lighter panel round the bedroom window', [0.4, 2.7], window, UPPER_FACE),
        slats(SLATS_X, UPPER_FACE),
        piece('wallLight', 'Wall light on the slats', 'joint', [block([4.11, 4.19], [1.45, 1.6], out(UPPER_FACE, [0.07, 0.12]))]),
      ],
    },
  };
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
