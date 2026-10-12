// A level as a 1:50 architectural floor plan in SVG, generated from the same spec and model the
// viewer and the checks use, so the drawings sent out can never drift from the design. Plan
// coordinates are the level's: x east, z south (the street at the bottom), in metres; the SVG's
// width and height are set in millimetres so it prints true to scale.
import { FOOTPRINT, WALL_HEIGHT } from '../spec/global.js';
import { roomRects } from '../spec/helpers.js';
import { roomArea } from '../model/floors.js';
import { flightTopZ, starterFootX, treadBoxes } from '../model/stair.js';
import { BUILT_IN, ABOVE_CUT, DRAWN_DRESSING, FACADE_OUTLINES, FINISHES, PIECE_NAMES, ROOM_NAMES } from './vocabulary.js';

/** Paper millimetres per metre at 1:50. */
export const SCALE = 20;
const MM = 1 / SCALE;
const EPS = 1e-6;
// Dimension lines stand this far out from what they measure, and the overall line beyond the chain.
const CHAIN_OFFSET = 0.55;
const OVERALL_OFFSET = 0.95;
const MARGIN = 1.8;
// Where a room's tag sits on paper when its 3D pin would land on furniture.
const TAG_AT = Object.freeze({ living: [3.45, 6.2] });

const INK = '#1d1d1b';
const GREY = '#8a8782';
const LIGHT = '#c9c5bd';
const WALL_FILL = '#3b3a38';
const TEXT = { room: 3.2 * MM, small: 2.0 * MM, tiny: 1.7 * MM, dim: 2.2 * MM };

/** A length in metres the French way: two decimals and a comma. */
export function metres(value) {
  return value.toFixed(2).replace('.', ',');
}

function escape(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function attrs(map) {
  return Object.entries(map)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}="${typeof value === 'number' ? +value.toFixed(4) : escape(value)}"`)
    .join(' ');
}

function rect({ x, z }, style) {
  return `<rect ${attrs({ x: x[0], y: z[0], width: x[1] - x[0], height: z[1] - z[0], ...style })}/>`;
}

function line([x1, z1], [x2, z2], style) {
  return `<line ${attrs({ x1, y1: z1, x2, y2: z2, ...style })}/>`;
}

function text([x, z], content, { size = TEXT.small, anchor = 'middle', weight, rotate, fill = INK } = {}) {
  const transform = rotate ? `rotate(${rotate} ${+x.toFixed(4)} ${+z.toFixed(4)})` : undefined;
  return `<text ${attrs({ x, y: z, 'font-size': size, 'text-anchor': anchor, 'dominant-baseline': 'middle', 'font-weight': weight, fill, transform })}>${escape(content)}</text>`;
}

/** The plan rectangle of a model box. */
export function footprint(box) {
  return { x: [box.min[0], box.max[0]], z: [box.min[2], box.max[2]] };
}

function union(rects) {
  return {
    x: [Math.min(...rects.map((r) => r.x[0])), Math.max(...rects.map((r) => r.x[1]))],
    z: [Math.min(...rects.map((r) => r.z[0])), Math.max(...rects.map((r) => r.z[1]))],
  };
}

const centreOf = (r) => [(r.x[0] + r.x[1]) / 2, (r.z[0] + r.z[1]) / 2];

/** The plan rectangle of a stretch of wall between `from` and `to` along it. */
function wallRect(wall, [from, to]) {
  const across = [wall.at - wall.thickness / 2, wall.at + wall.thickness / 2];
  return wall.axis === 'x' ? { x: [from, to], z: across } : { x: across, z: [from, to] };
}

/** The solid stretches of a wall along its length, once every opening is taken out. */
export function wallSegments(wall) {
  const openings = [...wall.openings].sort((a, b) => a.from - b.from);
  const segments = [];
  let start = wall.from;
  for (const opening of openings) {
    if (opening.from > start + EPS) segments.push([start, opening.from]);
    start = Math.max(start, opening.to);
  }
  if (wall.to > start + EPS) segments.push([start, wall.to]);
  return segments;
}

/** A point on a wall's centre line, `along` its length. */
function onWall(wall, along, across = 0) {
  return wall.axis === 'x' ? [along, wall.at + across] : [wall.at + across, along];
}

function distanceToRect([px, pz], r) {
  const dx = Math.max(r.x[0] - px, 0, px - r.x[1]);
  const dz = Math.max(r.z[0] - pz, 0, pz - r.z[1]);
  return Math.hypot(dx, dz);
}

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const scale = (v, k) => [v[0] * k, v[1] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
const unit = (v) => scale(v, 1 / Math.hypot(...v));

/**
 * How a hinged door swings, read from its leaf drawn open in the model: the hinge is the jamb the
 * leaf stands at, the leaf points the way it lies, and the arc runs from the closed position to it
 * through the side the leaf is on (a quarter, or a half when the leaf folds back against the wall).
 */
export function doorSwing(wall, opening, leaf) {
  const jambs = [onWall(wall, opening.from), onWall(wall, opening.to)];
  const [hinge, other] = distanceToRect(jambs[0], leaf) <= distanceToRect(jambs[1], leaf) ? jambs : [jambs[1], jambs[0]];
  const radius = opening.to - opening.from;
  const toLeaf = sub(centreOf(leaf), hinge);
  const longAxis = leaf.x[1] - leaf.x[0] >= leaf.z[1] - leaf.z[0] ? [1, 0] : [0, 1];
  const open = scale(longAxis, dot(toLeaf, longAxis) >= 0 ? 1 : -1);
  const closed = unit(sub(other, hinge));
  const side = [-closed[1], closed[0]];
  const normal = dot(side, toLeaf) >= 0 ? side : scale(side, -1);
  const stops = Math.abs(dot(open, closed)) > 0.5 ? [closed, normal, open] : [closed, open];
  return { hinge, radius, open, stops };
}

function swingPath({ hinge, radius, stops }) {
  const points = stops.map((d) => add(hinge, scale(d, radius)));
  const arcs = points.slice(1).map((p, i) => {
    const sweep = cross(stops[i], stops[i + 1]) > 0 ? 1 : 0;
    return `A ${radius} ${radius} 0 0 ${sweep} ${+p[0].toFixed(4)} ${+p[1].toFixed(4)}`;
  });
  return `M ${+points[0][0].toFixed(4)} ${+points[0][1].toFixed(4)} ${arcs.join(' ')}`;
}

/** The repère printed on the plan and the schedule: windows F, doors P. */
export function tagOf(opening) {
  return opening.id.replace(/^Win/, 'F').replace(/^D/, 'P');
}

function windowSymbol(wall, opening) {
  const half = wall.thickness / 2;
  const style = { stroke: INK, 'stroke-width': 0.18 * MM };
  return [-half, half, -0.012, 0.012]
    .map((across) => line(onWall(wall, opening.from, across), onWall(wall, opening.to, across), style))
    .join('');
}

function slidingSymbol(wall, opening) {
  const mid = (opening.from + opening.to) / 2;
  const overlap = 0.05;
  const style = { stroke: INK, 'stroke-width': 0.3 * MM };
  return [
    line(onWall(wall, opening.from, -0.03), onWall(wall, mid + overlap, -0.03), style),
    line(onWall(wall, mid - overlap, 0.03), onWall(wall, opening.to, 0.03), style),
  ].join('');
}

function doorSymbol(wall, opening, leaf) {
  if (!leaf) return slidingSymbol(wall, opening);
  const swing = doorSwing(wall, opening, leaf);
  return [
    line(swing.hinge, add(swing.hinge, scale(swing.open, swing.radius)), { stroke: INK, 'stroke-width': 0.35 * MM }),
    `<path ${attrs({ d: swingPath(swing), fill: 'none', stroke: INK, 'stroke-width': 0.13 * MM })}/>`,
  ].join('');
}

/** Where an opening's tag sits: outside an exterior wall, on the opening's middle. */
function tagPosition(wall, opening, size) {
  const mid = (opening.from + opening.to) / 2;
  if (!wall.exterior) return onWall(wall, mid, -0.3);
  const outward = wall.axis === 'x' ? (wall.at > size[1] / 2 ? 1 : -1) : wall.at > size[0] / 2 ? 1 : -1;
  return onWall(wall, mid, outward * (wall.thickness / 2 + 0.22));
}

function drawWalls(spec, leaves) {
  const out = [];
  for (const wall of spec.walls) {
    const fill = wall.column ? INK : WALL_FILL;
    for (const segment of wallSegments(wall)) out.push(rect(wallRect(wall, segment), { fill, stroke: 'none' }));
    for (const opening of wall.openings) {
      if (opening.kind === 'window') out.push(windowSymbol(wall, opening));
      if (opening.kind === 'door') out.push(doorSymbol(wall, opening, leaves.get(opening.id)));
      if (opening.kind !== 'column') out.push(text(tagPosition(wall, opening, spec.size), tagOf(opening), { size: TEXT.tiny, weight: 'bold' }));
    }
  }
  return out.join('');
}

function pieceStyle(id) {
  if (ABOVE_CUT.has(id)) return { fill: 'none', stroke: GREY, 'stroke-width': 0.13 * MM, 'stroke-dasharray': `${MM} ${MM}` };
  if (BUILT_IN.has(id)) return { fill: '#efebe4', stroke: INK, 'stroke-width': 0.18 * MM };
  return { fill: 'none', stroke: GREY, 'stroke-width': 0.13 * MM };
}

function drawPieces(entries) {
  const out = [];
  for (const { piece, boxes } of entries) {
    const style = pieceStyle(piece.id);
    for (const box of boxes) out.push(rect(footprint(box), style));
    const name = PIECE_NAMES[piece.id];
    if (name) out.push(text(centreOf(union(boxes.map(footprint))), name, { size: TEXT.tiny, fill: '#4a4844' }));
  }
  return out.join('');
}

/** The stair's figures, printed in its tag in place of an area. */
function stairLine(stair) {
  return `${stair.starter.risers + stair.risers} contremarches de ${metres(stair.riser)} — giron ${metres(stair.going)}`;
}

function roomTag(spec, room) {
  const anchor = TAG_AT[room.id] ?? spec.labels?.find((l) => l.id === room.id)?.anchor ?? centreOf(roomRects(room)[0]);
  const lines = [[ROOM_NAMES[room.id] ?? room.name, { size: TEXT.room, weight: 'bold' }]];
  if (room.id === 'stair' && spec.stair) {
    lines.push([stairLine(spec.stair), { size: TEXT.tiny }]);
  } else if (room.finish) {
    const single = room.extra.length === 0 ? `${metres(room.x[1] - room.x[0])} × ${metres(room.z[1] - room.z[0])} m — ` : '';
    lines.push([`${single}${roomArea(room).toFixed(1).replace('.', ',')} m²`, { size: TEXT.small }]);
    lines.push([FINISHES[room.finish], { size: TEXT.tiny, fill: '#5a5752' }]);
  }
  const step = 4.2 * MM;
  const top = anchor[1] - ((lines.length - 1) * step) / 2;
  const width = Math.max(...lines.map(([content, style]) => content.length * style.size * 0.55)) + 2 * MM;
  const backing = rect({ x: [anchor[0] - width / 2, anchor[0] + width / 2], z: [top - step * 0.6, top + step * (lines.length - 0.4)] }, { fill: 'white', opacity: 0.85 });
  return backing + lines.map(([content, style], i) => text([anchor[0], top + i * step], content, style)).join('');
}

function drawStair(stair) {
  const thin = { fill: 'white', stroke: INK, 'stroke-width': 0.13 * MM };
  const treads = treadBoxes(stair).map((box) => rect(footprint(box), thin)).join('');
  const landingZ = (stair.landing.z[0] + stair.landing.z[1]) / 2;
  const flightX = (stair.x[0] + stair.x[1]) / 2;
  const top = flightTopZ(stair) + 0.2;
  const path = `M ${starterFootX(stair)} ${landingZ} L ${flightX} ${landingZ} L ${flightX} ${top}`;
  const arrow = `<path ${attrs({ d: path, fill: 'none', stroke: INK, 'stroke-width': 0.25 * MM })}/>`;
  const head = `<path ${attrs({ d: `M ${flightX - 0.08} ${top + 0.16} L ${flightX} ${top} L ${flightX + 0.08} ${top + 0.16}`, fill: 'none', stroke: INK, 'stroke-width': 0.25 * MM })}/>`;
  return treads + arrow + head + text([starterFootX(stair) - 0.12, landingZ], 'M', { size: TEXT.small, weight: 'bold' });
}

function drawVoid(room) {
  const r = roomRects(room)[0];
  const style = { stroke: GREY, 'stroke-width': 0.13 * MM, 'stroke-dasharray': `${1.5 * MM} ${MM}` };
  return line([r.x[0], r.z[0]], [r.x[1], r.z[1]], style) + line([r.x[1], r.z[0]], [r.x[0], r.z[1]], style);
}

/** The parents' garage beside the ground level: its walls cut, its roof dashed above. */
function drawGarage(neighbours) {
  const garage = neighbours.find((entry) => entry.piece.id === 'garage');
  if (!garage) return { svg: '', rects: [] };
  const walls = garage.boxes.filter((b) => b.max[1] <= WALL_HEIGHT + EPS).map(footprint);
  const roof = garage.boxes.filter((b) => b.min[1] >= WALL_HEIGHT - EPS).map(footprint);
  const hatch = { fill: 'url(#context)', stroke: GREY, 'stroke-width': 0.18 * MM };
  const dashed = { fill: 'none', stroke: GREY, 'stroke-width': 0.13 * MM, 'stroke-dasharray': `${2 * MM} ${MM}` };
  const all = union([...walls, ...roof]);
  const svg = walls.map((r) => rect(r, hatch)).join('') + roof.map((r) => rect(r, dashed)).join('')
    + text([centreOf(all)[0], centreOf(all)[1] - 0.3], 'Garage — maison des parents', { size: TEXT.small, weight: 'bold', fill: '#5a5752' })
    + text([centreOf(all)[0], centreOf(all)[1] + 0.05], 'hors projet, ouvert sur rue', { size: TEXT.tiny, fill: '#5a5752' });
  return { svg, rects: [all] };
}

/** The garage roof as the first level's terrace: its parapets cut, its floor a pale field. */
function drawTerrace(neighbours) {
  const garage = neighbours.find((entry) => entry.piece.id === 'garage');
  const parapet = neighbours.find((entry) => entry.piece.id === 'garageParapet');
  if (!garage || !parapet) return { svg: '', rects: [] };
  const roof = garage.boxes.filter((b) => b.min[1] >= WALL_HEIGHT - EPS).map(footprint);
  const deck = union(roof);
  const height = parapet.boxes[0].max[1] - parapet.boxes[0].min[1];
  const svg = rect(deck, { fill: '#f4f1ea', stroke: GREY, 'stroke-width': 0.13 * MM })
    + parapet.boxes.map((b) => rect(footprint(b), { fill: WALL_FILL, stroke: 'none' })).join('')
    + text([centreOf(deck)[0], centreOf(deck)[1] - 0.3], 'Terrasse sur toit du garage', { size: TEXT.room, weight: 'bold' })
    + text([centreOf(deck)[0], centreOf(deck)[1] + 0.05], `garde-corps maçonné h ${metres(height)}`, { size: TEXT.small })
    + text([centreOf(deck)[0], centreOf(deck)[1] + 0.35], 'seuil de plain-pied depuis le palier', { size: TEXT.tiny, fill: '#5a5752' });
  return { svg, rects: [deck] };
}

/** On a level that overhangs the street, the ground level's street face beneath, dashed. */
function drawOverhangLine(spec) {
  if (spec.size[1] <= FOOTPRINT.depth + EPS) return '';
  const z = FOOTPRINT.depth;
  const style = { stroke: GREY, 'stroke-width': 0.18 * MM, 'stroke-dasharray': `${3 * MM} ${MM} ${0.5 * MM} ${MM}` };
  return line([-0.3, z], [spec.size[0] + 0.3, z], style)
    + text([0.25, z - 0.12], `aplomb façade RDC — encorbellement ${metres(spec.size[1] - FOOTPRINT.depth)}`, { size: TEXT.tiny, anchor: 'start', fill: '#5a5752' });
}

/**
 * The points a dimension chain ticks along an exterior wall: its two outer corners and every
 * opening's edges, so the contractor can set out each opening from a corner.
 */
export function chainPositions(wall, size) {
  const length = wall.axis === 'x' ? size[0] : size[1];
  const edges = wall.openings.flatMap((o) => [o.from, o.to]);
  return [...new Set([0, ...edges, length].map((v) => +v.toFixed(4)))].sort((a, b) => a - b);
}

function dimensionChain(positions, axis, at, side) {
  const style = { stroke: INK, 'stroke-width': 0.13 * MM };
  const point = (along, off = 0) => (axis === 'x' ? [along, at + off] : [at + off, along]);
  const tick = 0.06;
  const out = [line(point(positions[0]), point(positions[positions.length - 1]), style)];
  for (const p of positions) out.push(line(add(point(p), [-tick, tick]), add(point(p), [tick, -tick]), { ...style, 'stroke-width': 0.3 * MM }));
  positions.slice(1).forEach((p, i) => {
    const mid = (p + positions[i]) / 2;
    const offset = side * (i % 2 && p - positions[i] < 0.45 ? 0.24 : 0.11);
    out.push(text(point(mid, offset), metres(p - positions[i]), { size: TEXT.dim, rotate: axis === 'z' ? -90 : undefined }));
  });
  return out.join('');
}

function drawDimensions(spec, bounds) {
  const sides = {
    north: { axis: 'x', at: bounds.z[0], side: -1 },
    south: { axis: 'x', at: bounds.z[1], side: 1 },
    west: { axis: 'z', at: bounds.x[0], side: -1 },
    east: { axis: 'z', at: bounds.x[1], side: 1 },
  };
  const out = [];
  for (const wall of spec.walls.filter((w) => w.exterior && !w.column && sides[w.id])) {
    const { axis, at, side } = sides[wall.id];
    const positions = chainPositions(wall, spec.size);
    const length = positions[positions.length - 1];
    if (positions.length > 2) out.push(dimensionChain(positions, axis, at + side * CHAIN_OFFSET, side));
    out.push(dimensionChain([0, length], axis, at + side * OVERALL_OFFSET, side));
  }
  return out.join('');
}

function defs() {
  const hatch = `<pattern id="context" patternUnits="userSpaceOnUse" width="0.12" height="0.12" patternTransform="rotate(45)">`
    + `<line x1="0" y1="0" x2="0" y2="0.12" stroke="${LIGHT}" stroke-width="${0.25 * MM}"/></pattern>`;
  return `<defs>${hatch}</defs>`;
}

/**
 * One level's plan as an SVG string drawn at 1:50. `level` is a built level ({ spec, model });
 * `site` is the ground level's neighbours, drawn as the garage beside the ground level and as the
 * terrace beside the first.
 */
export function planSvg({ spec, model }, site = []) {
  const leaves = new Map(model.dressing.filter((e) => e.piece.id.startsWith('door')).map((e) => [e.piece.id.slice(4), union(e.boxes.map(footprint))]));
  const context = spec.stair ? drawGarage(site) : drawTerrace(site);
  const facade = model.facadeDressing.filter((e) => (FACADE_OUTLINES[spec.id] ?? []).includes(e.piece.id));
  const facadeRects = facade.flatMap((e) => e.boxes.map(footprint));
  // Dimensions stand clear of everything drawn outside the footprint.
  const bounds = union([{ x: [0, spec.size[0]], z: [0, spec.size[1]] }, ...context.rects, ...facadeRects]);
  const box = { x: [bounds.x[0] - MARGIN, bounds.x[1] + MARGIN], z: [bounds.z[0] - MARGIN, bounds.z[1] + MARGIN] };
  const width = box.x[1] - box.x[0];
  const height = box.z[1] - box.z[0];

  const floors = model.floors.map((f) => rect(footprint(f), { fill: f.room === 'void' ? 'none' : '#fbfaf7', stroke: 'none' })).join('');
  const body = [
    context.svg,
    floors,
    facade.map((e) => e.boxes.map((b) => rect(footprint(b), { fill: 'none', stroke: GREY, 'stroke-width': 0.13 * MM })).join('')).join(''),
    drawPieces(model.furniture),
    drawPieces(model.dressing.filter((e) => DRAWN_DRESSING.has(e.piece.id))),
    spec.stair ? drawStair(spec.stair) : '',
    spec.rooms.filter((r) => r.id === 'void').map(drawVoid).join(''),
    drawWalls(spec, leaves),
    drawOverhangLine(spec),
    spec.rooms.map((room) => roomTag(spec, room)).join(''),
    drawDimensions(spec, bounds),
    text([spec.size[0] / 2, bounds.z[1] + OVERALL_OFFSET + 0.4], 'RUE', { size: TEXT.room, weight: 'bold' }),
    text([spec.size[0] + 0.1, spec.size[1] / 2], 'mur mitoyen', { size: TEXT.tiny, rotate: -90, fill: '#5a5752' }),
  ].join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width * SCALE}mm" height="${height * SCALE}mm" `
    + `viewBox="${box.x[0]} ${box.z[0]} ${width} ${height}" font-family="Helvetica, Arial, sans-serif">${defs()}${body}</svg>`;
}

/** The plan's size on paper, in millimetres. */
export function planPaperSize(svg) {
  const [, width, height] = svg.match(/width="([\d.]+)mm" height="([\d.]+)mm"/);
  return [Number(width), Number(height)];
}
