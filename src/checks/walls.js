// Check 8: partitions stay inside the interior envelope so no end face is coplanar with a facade.
import { INTERIOR } from '../spec/global.js';
import { EPS } from '../model/box.js';
import { result } from './result.js';

export function checkPartitionClipping(house) {
  const failures = [];
  let partitions = 0;
  for (const { spec, model } of house.levels) {
    for (const { wall, envelope } of model.walls) {
      if (wall.exterior) continue;
      partitions += 1;
      const inside =
        envelope.min[0] >= INTERIOR.min - EPS &&
        envelope.max[0] <= INTERIOR.max + EPS &&
        envelope.min[2] >= INTERIOR.min - EPS &&
        envelope.max[2] <= INTERIOR.max + EPS;
      if (!inside) failures.push(`${spec.name}: ${wall.id} reaches outside ${INTERIOR.min}–${INTERIOR.max}`);
    }
  }
  return result(8, 'Partitions clipped to the interior envelope', failures, [`${partitions} partitions checked`]);
}
