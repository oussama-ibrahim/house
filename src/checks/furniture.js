// Checks 5, 6, 7 and 10: furniture against walls, clear zones, window prisms, and door swings.
import { CHECKS, WALL_HEIGHT } from '../spec/global.js';
import { boxFromRect, EPS, intersects, overlap, planGap } from '../model/box.js';
import { furnitureBoxList } from '../model/level.js';
import { openingPrism } from '../model/walls.js';
import { result } from './result.js';

export function checkWallContacts(house) {
  const failures = [];
  let contacts = 0;
  for (const { spec, model } of house.levels) {
    for (const { piece, boxes } of model.furniture) {
      const touched = new Set();
      for (const box of boxes) {
        for (const { wall, envelope } of model.walls) {
          if (intersects(box, envelope)) {
            failures.push(`${spec.name}: ${piece.name} intersects ${wall.id}`);
            continue;
          }
          const gap = planGap(box, envelope);
          if (gap <= EPS) {
            touched.add(wall.id);
            if (!piece.touches.includes(wall.id)) failures.push(`${spec.name}: ${piece.name} touches ${wall.id} but the Touches column does not say so`);
          } else if (gap < CHECKS.minWallGap - EPS) {
            failures.push(`${spec.name}: ${piece.name} is ${gap.toFixed(3)} m from ${wall.id}, closer than ${CHECKS.minWallGap}`);
          }
        }
      }
      for (const id of piece.touches) {
        if (!touched.has(id)) failures.push(`${spec.name}: ${piece.name} is listed as touching ${id} but does not`);
      }
      contacts += touched.size;
    }
  }
  return result(5, 'Furniture clear of walls except listed contacts', failures, [`${contacts} listed wall contacts verified`]);
}

export function checkClearZones(house) {
  const failures = [];
  const details = [];
  for (const { spec, model } of house.levels) {
    const boxes = furnitureBoxList(model);
    for (const zone of spec.clearZones) {
      const zoneBox = boxFromRect(`zone:${zone.opening}`, zone.x, [0, CHECKS.clearZoneHeight], zone.z, 'none');
      let nearest = Infinity;
      for (const box of boxes) {
        if (intersects(box, zoneBox)) failures.push(`${spec.name}: ${box.id} enters the ${zone.opening} clear zone`);
        nearest = Math.min(nearest, planGap(box, zoneBox));
      }
      details.push(`${zone.opening}: nearest furniture ${nearest.toFixed(2)} m`);
    }
  }
  return result(6, 'Door clear zones empty', failures, details);
}

export function checkWindowPrisms(house) {
  const failures = [];
  let prisms = 0;
  for (const { spec, model } of house.levels) {
    for (const { wall } of model.walls) {
      for (const opening of wall.openings) {
        if (opening.kind !== 'window') continue;
        prisms += 1;
        const prism = openingPrism(wall, opening, CHECKS.windowPrismDepth);
        for (const { piece, boxes } of model.furniture) {
          if (piece.transparent) continue;
          for (const box of boxes) {
            if (intersects(box, prism)) failures.push(`${spec.name}: ${piece.name} stands in the ${opening.id} prism`);
          }
        }
      }
    }
  }
  return result(7, 'Window prisms clear of opaque furniture', failures, [`${prisms} windows checked, transparent elements exempt`]);
}

/** Distance from a plane, sweeping in `direction` along `axis` across `span`, to the first obstacle. */
function clearDistance(sweep, obstacles, maxDistance) {
  const alongAxis = sweep.axis === 'x' ? 0 : 2;
  const spanAxis = sweep.axis === 'x' ? 2 : 0;
  const spanBox = { min: [], max: [] };
  spanBox.min[spanAxis] = sweep.span[0];
  spanBox.max[spanAxis] = sweep.span[1];
  let nearest = maxDistance;
  for (const box of obstacles) {
    if (overlap(box, spanBox, spanAxis) <= EPS) continue;
    const near = sweep.direction > 0 ? box.min[alongAxis] : box.max[alongAxis];
    const far = sweep.direction > 0 ? box.max[alongAxis] : box.min[alongAxis];
    const distance = (near - sweep.at) * sweep.direction;
    const straddles = (far - sweep.at) * sweep.direction > EPS && distance < EPS;
    if (straddles) return 0;
    if (distance >= -EPS) nearest = Math.min(nearest, Math.max(distance, 0));
  }
  return nearest;
}

export function checkClearances(house) {
  const failures = [];
  const details = [];
  const maxSweep = WALL_HEIGHT;
  for (const { spec, model } of house.levels) {
    for (const sweep of spec.clearances) {
      const obstacles = [
        ...furnitureBoxList(model).filter((box) => !sweep.ignore.includes(box.piece)),
        ...model.walls.map((entry) => entry.envelope),
      ];
      const distance = clearDistance(sweep, obstacles, maxSweep);
      details.push(`${sweep.label}: ${distance.toFixed(2)} m clear (expected ${sweep.expected.toFixed(2)})`);
      if (distance < CHECKS.minClearance - EPS) failures.push(`${spec.name}: ${sweep.label} has only ${distance.toFixed(2)} m in front of it`);
      if (Math.abs(distance - sweep.expected) > 0.01) failures.push(`${spec.name}: ${sweep.label} measures ${distance.toFixed(2)} m, spec expects ${sweep.expected}`);
    }
  }
  return result(10, 'Wardrobe doors and shower entry have room', failures, details);
}
