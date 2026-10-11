// Circulation: the clear width across a level's plan, so tests can prove furniture leaves the walking
// routes open. Not one of the Part 7 checks; the living-room layout once passed all eleven while the
// front door led nowhere wider than 0.30 m.
import { EPS } from '../model/box.js';
import { furnitureBoxList } from '../model/level.js';

const STEP = 0.025;
// Boxes starting at or above this height (wall cabinets, the upper flight) are walked under.
const BODY_HEIGHT = 1.0;

function obstaclesOf(level) {
  return [
    // Glass panes are walls to a walker, though the scene draws them apart from the solids.
    ...level.walls.flatMap((entry) => [...entry.solids, ...entry.glazing]),
    ...furnitureBoxList(level),
    ...level.treads,
  ].filter((box) => box.min[1] < BODY_HEIGHT);
}

/** Clear width at the centre of every plan cell: twice the distance to the nearest obstacle. */
export function clearWidthGrid(level) {
  const [width, depth] = level.spec.size;
  const nx = Math.round(width / STEP);
  const nz = Math.round(depth / STEP);
  const obstacles = obstaclesOf(level);
  const clear = new Float64Array(nx * nz);
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < nz; j++) {
      const x = (i + 0.5) * STEP;
      const z = (j + 0.5) * STEP;
      let nearest = Infinity;
      for (const box of obstacles) {
        const dx = Math.max(box.min[0] - x, 0, x - box.max[0]);
        const dz = Math.max(box.min[2] - z, 0, z - box.max[2]);
        nearest = Math.min(nearest, Math.hypot(dx, dz));
      }
      clear[i * nz + j] = 2 * nearest;
    }
  }
  return { nx, nz, clear };
}

/**
 * True when a body needing `width` can walk from `from` to `to` (plan points [x, z]). Cell centres
 * under-measure a gap by up to one grid step, so the threshold allows that much.
 */
export function routeIsClear(grid, from, to, width) {
  const { nx, nz, clear } = grid;
  const cellOf = ([x, z]) => Math.floor(x / STEP) * nz + Math.floor(z / STEP);
  const passable = (cell) => clear[cell] >= width - STEP - EPS;
  const start = cellOf(from);
  const goal = cellOf(to);
  if (!passable(start) || !passable(goal)) return false;
  const seen = new Uint8Array(nx * nz);
  const queue = [start];
  seen[start] = 1;
  while (queue.length) {
    const cell = queue.pop();
    if (cell === goal) return true;
    const i = Math.floor(cell / nz);
    const j = cell % nz;
    for (const [a, b] of [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]]) {
      if (a < 0 || b < 0 || a >= nx || b >= nz) continue;
      const next = a * nz + b;
      if (!seen[next] && passable(next)) {
        seen[next] = 1;
        queue.push(next);
      }
    }
  }
  return false;
}
