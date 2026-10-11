// Small constructors so the level specs read like the tables in the document.
import { WINDOW_TYPES } from './global.js';

/** Centre of a [from, to] range. */
export function midpoint([from, to]) {
  return (from + to) / 2;
}

/** Length of a [from, to] range. */
export function extent([from, to]) {
  return to - from;
}

/** Interior envelope of a level: from the wall thickness in to the far faces, per axis. */
export function interiorOf(spec, wallThickness = 0.2) {
  const [width, depth] = spec.size;
  return { min: wallThickness, xMax: width - wallThickness, zMax: depth - wallThickness };
}

export function grossAreaOf(spec) {
  return spec.size[0] * spec.size[1];
}

/**
 * A wall runs along `axis` ('x' or 'z') at centreline coordinate `at` on the other axis,
 * from `from` to `to` along its length. Openings are given in the same along-wall coordinate.
 */
export function wall(id, axis, at, thickness, from, to, openings = [], options = {}) {
  return { id, axis, at, thickness, from, to, openings, exterior: Boolean(options.exterior) };
}

/**
 * A structural column, modelled as a short wall so the splitter, the cut heights and every wall
 * check treat it exactly like one; `column: true` keeps it out of the partition tables.
 */
export function column({ id, x, z }, options = {}) {
  return { ...wall(id, 'x', midpoint(z), extent(z), x[0], x[1], [], options), column: true };
}

/**
 * The gap an exterior wall leaves for a column standing in its line: full height, nothing emitted,
 * so the column and the wall never overlap. The column itself is passed with `exterior: true`.
 */
export function columnPocket({ id, x }) {
  return { id, kind: 'column', from: x[0], to: x[1], sill: 0, head: Infinity };
}

/** `frame: true` gives a leafless opening a black frame, as in a glazed screen with a sliding leaf. */
export function door(id, from, to, head, options = {}) {
  return { id, kind: 'door', from, to, sill: 0, head, leaf: options.leaf !== false, frame: Boolean(options.frame) };
}

/**
 * `transom` adds a horizontal frame member at that height, for floor-to-ceiling glazing.
 * `open: true` makes a bare opening with neither pane nor frame, such as a balcony parapet.
 */
export function windowOpening(id, from, to, sill, head, options = {}) {
  return { id, kind: 'window', from, to, sill, head, transom: options.transom ?? null, open: Boolean(options.open) };
}

/** A window of one of the family's types, placed by its start along the wall. */
export function windowOf(id, type, from) {
  const size = WINDOW_TYPES[type];
  if (!size) throw new Error(`No window type "${type}"`);
  return { ...windowOpening(id, from, from + size.width, size.sill, size.head, { transom: size.transom }), type };
}

/**
 * `tableArea` is the rounded figure printed in the spec's room table; checks compare against it.
 * An L-shaped room lists its further rectangles in `options.extra`; `x`/`z` stay its main rectangle.
 */
export function room(id, name, x, z, finish, tableArea, options = {}) {
  return { id, name, x, z, finish, tableArea, extra: options.extra ?? [] };
}

/** Every rectangle of a room, main one first. */
export function roomRects(room) {
  return [{ x: room.x, z: room.z }, ...room.extra];
}

export function clearZone(opening, x, z) {
  return { opening, x, z };
}

/**
 * One box of a furniture piece: footprint w (x) × d (z), height h, standing at y0.
 * `options.material` overrides the piece material for this box alone.
 */
export function part(w, d, h, cx, cz, y0 = 0, options = {}) {
  return { size: [w, d, h], centre: [cx, cz], y0, material: options.material ?? null };
}

/** A part given as its three ranges, x, y and z, instead of a size and centre. */
export function block(x, y, z, material) {
  return part(extent(x), extent(z), extent(y), midpoint(x), midpoint(z), y[0], { material });
}

/**
 * A sliding glass leaf in a black frame, drawn where it lies when slid open: over `span` along
 * `axis`, its plane at `at` on the other axis, `height` tall.
 */
export function slidingLeafParts(axis, span, at, height) {
  const along = (length, thickness, h, centre, y0 = 0, options = {}) =>
    axis === 'x' ? part(length, thickness, h, centre, at, y0, options) : part(thickness, length, h, at, centre, y0, options);
  const [length, centre] = [extent(span), midpoint(span)];
  const frame = { material: 'frame' };
  return [
    along(length, 0.02, height, centre),
    along(0.05, 0.04, height, span[0] + 0.025, 0, frame),
    along(0.05, 0.04, height, span[1] - 0.025, 0, frame),
    along(length, 0.04, 0.05, centre, height - 0.05, frame),
    along(length, 0.04, 0.05, centre, 0, frame),
  ];
}

export function piece(id, name, material, parts, options = {}) {
  return {
    id,
    name,
    material,
    parts,
    touches: options.touches ?? [],
    transparent: Boolean(options.transparent),
  };
}

/**
 * A clearance sweep for check 10: starting on the plane `axis = at`, moving in `direction`
 * (+1 or −1) along `axis`, across `span` on the other axis. `ignore` lists furniture ids that
 * form the opening itself and so must not count as obstacles.
 */
export function clearance(id, label, { axis, at, direction, span, ignore = [], expected }) {
  return { id, label, axis, at, direction, span, ignore, expected };
}

export function visibilityTarget(id, expected) {
  return { id, expected };
}

/** A pinned label: leader from `anchor` (x, z on the floor) up to a point displaced by `offset` (dx, dz). */
export function label(id, text, anchor, offset = [0, 0]) {
  return { id, text, anchor, offset };
}
