// Label pins, level captions, dimension lines and size tags as plain geometry; the scene turns them
// into DOM labels.
import { grossAreaOf } from '../spec/helpers.js';
import { DIMENSIONS, LABELS } from '../spec/presentation.js';
import { roomArea } from './floors.js';

/** One pin per spec label: a leader from the floor anchor to a raised, offset label point. */
export function roomLabels(spec) {
  return spec.labels.map((entry) => ({
    id: entry.id,
    text: entry.text,
    anchor: [entry.anchor[0], LABELS.anchorHeight, entry.anchor[1]],
    point: [entry.anchor[0] + entry.offset[0], LABELS.leaderHeight, entry.anchor[1] + entry.offset[1]],
  }));
}

export function levelCaption(spec) {
  const [x, z] = spec.caption;
  return {
    title: spec.name,
    gross: grossAreaOf(spec),
    net: spec.netArea,
    position: [x, LABELS.captionHeight, z],
  };
}

/** One size tag per room, the stair void included: its main rectangle's width × depth and area. */
export function roomDimensions(spec) {
  return spec.rooms.map((room) => ({
    id: room.id,
    name: room.name,
    size: [room.x[1] - room.x[0], room.z[1] - room.z[0]],
    area: roomArea(room),
    position: [(room.x[0] + room.x[1]) / 2, LABELS.captionHeight, (room.z[0] + room.z[1]) / 2],
  }));
}

const EDGES = {
  north: (w, d, off, y) => ({ from: [0, y, -off], to: [w, y, -off], tickAxis: 2, length: w }),
  south: (w, d, off, y) => ({ from: [0, y, d + off], to: [w, y, d + off], tickAxis: 2, length: w }),
  west: (w, d, off, y) => ({ from: [-off, y, 0], to: [-off, y, d], tickAxis: 0, length: d }),
  east: (w, d, off, y) => ({ from: [w + off, y, 0], to: [w + off, y, d], tickAxis: 0, length: d }),
};

/** A dimension line per named edge of the level, each with end ticks, its length and a centred label point. */
export function dimensionLines(spec) {
  const { offset, tick, lineHeight } = DIMENSIONS;
  const [width, depth] = spec.size;
  return spec.dimensionEdges.map((edge) => {
    const build = EDGES[edge];
    if (!build) throw new Error(`Unknown dimension edge "${edge}"`);
    const { from, to, tickAxis, length } = build(width, depth, offset, lineHeight);
    const ticks = [from, to].map((end) => {
      const a = [...end];
      const b = [...end];
      a[tickAxis] -= tick / 2;
      b[tickAxis] += tick / 2;
      return [a, b];
    });
    const middle = from.map((value, i) => (value + to[i]) / 2);
    return { id: edge, from, to, ticks, middle, length };
  });
}

/**
 * Every annotation point on the level (pin ends, caption, dimension lines with their ticks), so the
 * camera can frame them too. Kept as points, not a box: a box around them would add corners that
 * nothing occupies and push the camera back for no reason.
 */
export function annotationPoints(spec) {
  return [
    ...roomLabels(spec).flatMap((pin) => [pin.anchor, pin.point]),
    levelCaption(spec).position,
    ...dimensionLines(spec).flatMap((line) => [line.from, line.to, ...line.ticks.flat()]),
  ];
}
