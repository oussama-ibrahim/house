// Check 8: partitions stay inside the interior envelope so no end face is coplanar with a facade.
import { interiorOf } from '../spec/helpers.js';
import { EPS } from '../model/box.js';
import { result } from './result.js';

export function checkPartitionClipping(house) {
  const failures = [];
  let partitions = 0;
  for (const { spec, model } of house.levels) {
    const { min, xMax, zMax } = interiorOf(spec);
    for (const { wall, envelope } of model.walls) {
      if (wall.exterior) continue;
      partitions += 1;
      const inside = envelope.min[0] >= min - EPS && envelope.max[0] <= xMax + EPS && envelope.min[2] >= min - EPS && envelope.max[2] <= zMax + EPS;
      if (!inside) failures.push(`${spec.name}: ${wall.id} reaches outside ${min}–${xMax} × ${min}–${zMax}`);
    }
  }
  return result(8, 'Partitions clipped to the interior envelope', failures, [`${partitions} partitions checked`]);
}
