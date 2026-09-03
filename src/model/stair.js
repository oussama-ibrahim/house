// Part 3. Treads are solid stacked boxes from y = 0, the way a poured concrete flight reads.
import { box } from './box.js';

export function pitch(stair) {
  return stair.riser / stair.going;
}

export function treadBoxes(stair) {
  const treads = [];
  for (let n = 1; n <= stair.treadCount; n++) {
    const north = stair.bottomZ - stair.going * n;
    const south = stair.bottomZ - stair.going * (n - 1);
    const top = stair.riser * n;
    const bottom = Math.max(0, top - stair.underside);
    treads.push(box(`tread-${n}`, [stair.x[0], bottom, north], [stair.x[1], top, south], 'structure', { tread: n }));
  }
  return treads;
}

/** Lowest point of the flight above a z position: the underside of whichever tread spans it. */
export function soffitHeightAt(stair, z) {
  const tread = treadBoxes(stair).find((t) => z >= t.min[2] - 1e-9 && z <= t.max[2] + 1e-9);
  return tread ? tread.min[1] : Infinity;
}

/** Nosing of tread n: its south (front) edge at height 0.18n. */
export function nosings(stair) {
  return Array.from({ length: stair.treadCount }, (_, i) => {
    const n = i + 1;
    return { n, z: stair.bottomZ - stair.going * (n - 1), y: stair.riser * n };
  });
}

/** Handrail centreline height: 0.90 above the line through the tread nosings. */
export function handrailCentrelineY(stair, z) {
  return pitch(stair) * (stair.bottomZ - z) + stair.riser + stair.handrail.aboveNosing;
}

/** Centreline x of the rail, offset from whichever flank wall it is fixed to. */
export function handrailX(stair) {
  const rail = stair.handrail;
  const inset = rail.wallOffset + rail.section / 2;
  return rail.side === 'west' ? stair.x[0] + inset : stair.x[1] - inset;
}

/** A single box, rotated about X to the pitch angle so its north end is the high end. */
export function handrailBox(stair) {
  const rail = stair.handrail;
  const x = handrailX(stair);
  const dz = rail.zFrom - rail.zTo;
  const dy = pitch(stair) * dz;
  const zMid = (rail.zFrom + rail.zTo) / 2;
  return {
    id: 'handrail',
    material: rail.material,
    centre: [x, handrailCentrelineY(stair, zMid), zMid],
    size: [rail.section, rail.section, Math.hypot(dz, dy)],
    rotationX: Math.atan(pitch(stair)),
  };
}
