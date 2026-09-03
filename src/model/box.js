// Axis-aligned boxes: { id, material, min: [x, y, z], max: [x, y, z] }.
// Coordinates are rounded to a micron so spec values like 0.375 − 0.175 land exactly on 0.2.

export const EPS = 1e-6;
const PRECISION = 1e6;

function round(value) {
  return Math.round(value * PRECISION) / PRECISION;
}

export function box(id, min, max, material, extra = {}) {
  return { id, material, min: min.map(round), max: max.map(round), ...extra };
}

export function boxFromRect(id, x, y, z, material, extra = {}) {
  return box(id, [x[0], y[0], z[0]], [x[1], y[1], z[1]], material, extra);
}

export function boxFromPart(id, { size: [w, d, h], centre: [cx, cz], y0 }, material, extra = {}) {
  return box(id, [cx - w / 2, y0, cz - d / 2], [cx + w / 2, y0 + h, cz + d / 2], material, extra);
}

export function overlap(a, b, axis) {
  return Math.min(a.max[axis], b.max[axis]) - Math.max(a.min[axis], b.min[axis]);
}

export function intersects(a, b, eps = EPS) {
  return overlap(a, b, 0) > eps && overlap(a, b, 1) > eps && overlap(a, b, 2) > eps;
}

/** Plan-view (x–z) gap between two boxes; 0 when their footprints touch or overlap. */
export function planGap(a, b) {
  const dx = Math.max(b.min[0] - a.max[0], a.min[0] - b.max[0], 0);
  const dz = Math.max(b.min[2] - a.max[2], a.min[2] - b.max[2], 0);
  return Math.hypot(dx, dz);
}

export function size(b) {
  return b.max.map((v, i) => v - b.min[i]);
}

export function centre(b) {
  return b.max.map((v, i) => (v + b.min[i]) / 2);
}

export function translate(b, [dx, dy, dz]) {
  return {
    ...b,
    min: [b.min[0] + dx, b.min[1] + dy, b.min[2] + dz],
    max: [b.max[0] + dx, b.max[1] + dy, b.max[2] + dz],
  };
}

export function unionBounds(boxes) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const b of boxes) {
    for (let i = 0; i < 3; i++) {
      min[i] = Math.min(min[i], b.min[i]);
      max[i] = Math.max(max[i], b.max[i]);
    }
  }
  return { min, max };
}

/** Area of a plan rectangle { x: [a, b], z: [a, b] }. */
export function planArea(rect) {
  return (rect.x[1] - rect.x[0]) * (rect.z[1] - rect.z[0]);
}

export function rectsOverlapInPlan(a, b, eps = EPS) {
  return (
    Math.min(a.x[1], b.x[1]) - Math.max(a.x[0], b.x[0]) > eps &&
    Math.min(a.z[1], b.z[1]) - Math.max(a.z[0], b.z[0]) > eps
  );
}

export function rectContains(outer, inner, eps = EPS) {
  return (
    inner.x[0] >= outer.x[0] - eps &&
    inner.x[1] <= outer.x[1] + eps &&
    inner.z[0] >= outer.z[0] - eps &&
    inner.z[1] <= outer.z[1] + eps
  );
}

export function rectsEqual(a, b, eps = EPS) {
  return rectContains(a, b, eps) && rectContains(b, a, eps);
}
