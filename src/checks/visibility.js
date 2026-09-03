// Check 9: from the default camera in cutaway mode, most of each key piece's top face is unobstructed.
// Occluders are wall solids, slab boxes and treads only; other furniture does not count.
import { CAMERA, CHECKS } from '../spec/global.js';
import { EPS, translate, unionBounds } from '../model/box.js';
import { orbitPosition } from '../model/camera.js';
import { findPiece, wallSolids } from '../model/level.js';
import { result } from './result.js';

function rayHitsBox(origin, direction, maxT, box) {
  let tNear = EPS;
  let tFar = maxT;
  for (let axis = 0; axis < 3; axis++) {
    if (Math.abs(direction[axis]) < 1e-12) {
      if (origin[axis] < box.min[axis] || origin[axis] > box.max[axis]) return false;
      continue;
    }
    let t1 = (box.min[axis] - origin[axis]) / direction[axis];
    let t2 = (box.max[axis] - origin[axis]) / direction[axis];
    if (t1 > t2) [t1, t2] = [t2, t1];
    tNear = Math.max(tNear, t1);
    tFar = Math.min(tFar, t2);
    if (tNear > tFar) return false;
  }
  return true;
}

function unobstructed(point, camera, occluders) {
  const direction = camera.map((c, i) => c - point[i]);
  const length = Math.hypot(...direction);
  const unit = direction.map((d) => d / length);
  return !occluders.some((box) => rayHitsBox(point, unit, length, box));
}

function topFaceGrid(bounds, n) {
  const points = [];
  const [x0, , z0] = bounds.min;
  const [x1, top, z1] = bounds.max;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      points.push([x0 + ((x1 - x0) * (i + 0.5)) / n, top, z0 + ((z1 - z0) * (j + 0.5)) / n]);
    }
  }
  return points;
}

function worldOccluders(house) {
  return house.levels.flatMap(({ model, offset }) =>
    [...wallSolids(model), ...model.slabs, ...model.treads].map((box) => translate(box, offset)),
  );
}

/** Per-target visibility percentages; `house` must be built in cutaway mode. */
export function measureVisibility(house) {
  const camera = orbitPosition(CAMERA);
  const occluders = worldOccluders(house);
  const measurements = [];
  for (const { spec, model, offset } of house.levels) {
    for (const target of spec.visibilityTargets) {
      const { piece, boxes } = findPiece(model, target.id);
      const bounds = unionBounds(boxes.map((box) => translate(box, offset)));
      const points = topFaceGrid(bounds, CHECKS.visibilityGrid);
      const visible = points.filter((point) => unobstructed(point, camera, occluders)).length;
      measurements.push({ level: spec.id, id: target.id, name: piece.name, percent: (100 * visible) / points.length, expected: target.expected });
    }
  }
  return measurements;
}

export function checkVisibility(house) {
  if (!house.cutaway) throw new Error('Check 9 runs against the cutaway build');
  const measurements = measureVisibility(house);
  const failures = [];
  const details = [];
  for (const m of measurements) {
    details.push(`${m.name}: ${m.percent.toFixed(0)} % visible (expected ${m.expected})`);
    if (m.percent < CHECKS.minVisibility) failures.push(`${m.name} is only ${m.percent.toFixed(0)} % visible`);
  }
  return result(9, 'Key furniture visible from the default camera', failures, details);
}
