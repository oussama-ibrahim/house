// Label pins, level captions, dimension lines and size tags as plain geometry; the scene turns them
// into DOM labels.
import { FOOTPRINT, GROSS_AREA } from '../spec/global.js';
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
    gross: GROSS_AREA,
    net: spec.netArea,
    position: [x, LABELS.captionHeight, z],
  };
}

/** One size tag per finished room: its main rectangle's width × depth and net area, on the floor. */
export function roomDimensions(spec) {
  return spec.rooms
    .filter((room) => room.finish)
    .map((room) => ({
      id: room.id,
      name: room.name,
      size: [room.x[1] - room.x[0], room.z[1] - room.z[0]],
      area: roomArea(room),
      position: [(room.x[0] + room.x[1]) / 2, LABELS.captionHeight, (room.z[0] + room.z[1]) / 2],
    }));
}

const EDGES = {
  north: (off, y) => ({ from: [0, y, -off], to: [FOOTPRINT, y, -off], tickAxis: 2 }),
  south: (off, y) => ({ from: [0, y, FOOTPRINT + off], to: [FOOTPRINT, y, FOOTPRINT + off], tickAxis: 2 }),
  west: (off, y) => ({ from: [-off, y, 0], to: [-off, y, FOOTPRINT], tickAxis: 0 }),
  east: (off, y) => ({ from: [FOOTPRINT + off, y, 0], to: [FOOTPRINT + off, y, FOOTPRINT], tickAxis: 0 }),
};

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

/** A dimension line per named edge of the level, each with end ticks and a centred label. */
export function dimensionLines(spec) {
  const { offset, tick, lineHeight } = DIMENSIONS;
  const text = `${FOOTPRINT.toFixed(2)} m`;
  return spec.dimensionEdges.map((edge) => {
    const build = EDGES[edge];
    if (!build) throw new Error(`Unknown dimension edge "${edge}"`);
    const { from, to, tickAxis } = build(offset, lineHeight);
    const ticks = [from, to].map((end) => {
      const a = [...end];
      const b = [...end];
      a[tickAxis] -= tick / 2;
      b[tickAxis] += tick / 2;
      return [a, b];
    });
    const middle = from.map((value, i) => (value + to[i]) / 2);
    return { id: edge, from, to, ticks, middle, text };
  });
}
