// Wall splitter. A wall with n openings becomes up to n + 1 piers plus a sill block below and a
// lintel block above each opening. Openings may touch a wall end or each other: the pier between
// them is then zero-length and is simply not emitted, never a degenerate box. Windows also get a
// pane and a black frame; a leafless door gets a frame when the spec asks for one.
import { GLAZING_THICKNESS } from '../spec/global.js';
import { FRAME } from '../spec/presentation.js';
import { box, EPS } from './box.js';
import { SpecError } from './errors.js';

function acrossRange(wall) {
  return [wall.at - wall.thickness / 2, wall.at + wall.thickness / 2];
}

function segmentBox(id, wall, along, y, material, extra = {}) {
  const across = acrossRange(wall);
  return wall.axis === 'x'
    ? box(id, [along[0], y[0], across[0]], [along[1], y[1], across[1]], material, extra)
    : box(id, [across[0], y[0], along[0]], [across[1], y[1], along[1]], material, extra);
}

/** Returns the openings sorted along the wall, or throws a SpecError describing the first bad one. */
export function validateWall(wall) {
  const sorted = [...wall.openings].sort((a, b) => a.from - b.from);
  let cursor = wall.from;
  for (const opening of sorted) {
    if (opening.from < wall.from - EPS || opening.to > wall.to + EPS) {
      throw new SpecError(`${opening.id} lies outside wall ${wall.id} (${wall.from}–${wall.to})`);
    }
    if (opening.to <= opening.from + EPS) {
      throw new SpecError(`${opening.id} on wall ${wall.id} has no width`);
    }
    if (opening.from < cursor - EPS) {
      throw new SpecError(`${opening.id} overlaps the previous opening on wall ${wall.id}`);
    }
    if (opening.sill < 0 || opening.head <= opening.sill + EPS) {
      throw new SpecError(`${opening.id} on wall ${wall.id} has an invalid sill/head (${opening.sill}/${opening.head})`);
    }
    cursor = opening.to;
  }
  return sorted;
}

/** The full solid slab of the wall, ignoring openings. Used for contact and clipping checks. */
export function wallEnvelope(wall, height) {
  return segmentBox(wall.id, wall, [wall.from, wall.to], [0, height], 'wall', { wall: wall.id });
}

/** Frame members sitting in the reveal: jambs, rails, mullions and an optional transom. */
function frameMembers(wall, opening, height) {
  const bottom = opening.sill;
  const top = Math.min(opening.head, height);
  if (top - bottom <= 2 * FRAME.member) return [];
  const profile = { ...wall, thickness: FRAME.depth };
  const members = [];
  const member = (name, along, y) =>
    members.push(segmentBox(`${wall.id}:${opening.id}:${name}`, profile, along, y, 'frame', { wall: wall.id, role: 'frame', opening: opening.id }));

  member('jambA', [opening.from, opening.from + FRAME.member], [bottom, top]);
  member('jambB', [opening.to - FRAME.member, opening.to], [bottom, top]);
  if (opening.kind === 'window') member('sillRail', [opening.from, opening.to], [bottom, bottom + FRAME.member]);
  if (opening.head <= height + EPS) member('headRail', [opening.from, opening.to], [top - FRAME.member, top]);

  const width = opening.to - opening.from;
  const panes = Math.max(1, Math.round(width / FRAME.paneWidth));
  for (let i = 1; i < panes; i++) {
    const at = opening.from + (width * i) / panes;
    member(`mullion${i}`, [at - FRAME.member / 2, at + FRAME.member / 2], [bottom, top]);
  }
  if (opening.transom && opening.transom < top - FRAME.member) {
    member('transom', [opening.from, opening.to], [opening.transom - FRAME.member / 2, opening.transom + FRAME.member / 2]);
  }
  return members;
}

/**
 * Splits a wall into solid boxes for the given render height. Heights above `height` are clipped,
 * which is how cutaway mode works: a window whose sill is above the cut becomes plain wall.
 */
export function splitWall(wall, height) {
  const openings = validateWall(wall);
  const solids = [];
  const glazing = [];
  const frames = [];
  let cursor = wall.from;
  let pierIndex = 0;

  const emitPier = (from, to) => {
    if (to - from > EPS) {
      solids.push(segmentBox(`${wall.id}:pier${pierIndex}`, wall, [from, to], [0, height], 'wall', { wall: wall.id, role: 'pier' }));
    }
    pierIndex += 1;
  };

  for (const opening of openings) {
    emitPier(cursor, opening.from);
    const span = [opening.from, opening.to];
    const sillTop = Math.min(opening.sill, height);
    if (sillTop > EPS) {
      solids.push(segmentBox(`${wall.id}:${opening.id}:sill`, wall, span, [0, sillTop], 'wall', { wall: wall.id, role: 'sill' }));
    }
    if (opening.head < height - EPS) {
      solids.push(segmentBox(`${wall.id}:${opening.id}:lintel`, wall, span, [opening.head, height], 'wall', { wall: wall.id, role: 'lintel' }));
    }
    const glazed = opening.kind === 'window' && !opening.open;
    if (glazed && opening.sill < height - EPS) {
      const pane = { ...wall, thickness: GLAZING_THICKNESS };
      glazing.push(segmentBox(`${wall.id}:${opening.id}:glazing`, pane, span, [opening.sill, Math.min(opening.head, height)], 'glazing', {
        wall: wall.id,
        role: 'glazing',
        opening: opening.id,
      }));
    }
    if (glazed || opening.frame) frames.push(...frameMembers(wall, opening, height));
    cursor = opening.to;
  }
  emitPier(cursor, wall.to);

  return { solids, glazing, frames };
}

/** Coordinate of the wall's finished face on the given side ('min' or 'max' along the across axis). */
export function wallFace(wall, side) {
  const [min, max] = acrossRange(wall);
  return side === 'min' ? min : max;
}

// BoxGeometry's face order, so the scene can map a box's per-face finishes onto a material array.
export const BOX_FACES = Object.freeze(['px', 'nx', 'py', 'ny', 'pz', 'nz']);

/** The vertical faces of a box that lie on the outer face of a `[width, depth]` footprint. */
export function envelopeFaces(box, [width, depth]) {
  const on = (value, plane) => Math.abs(value - plane) <= EPS;
  return [
    on(box.max[0], width) && 'px',
    on(box.min[0], 0) && 'nx',
    on(box.max[2], depth) && 'pz',
    on(box.min[2], 0) && 'nz',
  ].filter(Boolean);
}

/**
 * Gives every exterior wall solid the facade finish on the faces it shows the street and the
 * neighbours, corner ends included; reveals, tops and interior faces keep the wall material.
 */
export function cladSolids(solids, wall, size, finish) {
  if (!finish || !wall.exterior) return solids;
  return solids.map((solid) => {
    const faces = envelopeFaces(solid, size);
    return faces.length ? { ...solid, faces: Object.fromEntries(faces.map((face) => [face, finish])) } : solid;
  });
}

/** Unit vector pointing out of the building through an exterior wall. */
export function outwardNormal(wall) {
  if (!wall.exterior) throw new SpecError(`${wall.id} is a partition and has no outward side`);
  // Exterior walls sit half a thickness in from the facade, so the one within a thickness of the
  // origin is the north or west wall and faces the negative way; every other one faces positive.
  const outward = wall.at < wall.thickness ? -1 : 1;
  return wall.axis === 'x' ? [0, 0, outward] : [outward, 0, 0];
}

/** The vertical prism of a window: its span × sill-to-head × `depth` beyond each face of the wall. */
export function openingPrism(wall, opening, depth) {
  const [min, max] = acrossRange(wall);
  const thick = { ...wall, at: (min + max) / 2, thickness: wall.thickness + 2 * depth };
  return segmentBox(`${wall.id}:${opening.id}:prism`, thick, [opening.from, opening.to], [opening.sill, opening.head], 'none', {
    opening: opening.id,
  });
}
