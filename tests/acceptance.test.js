// Part 7 of the spec, run as assertions.
import { describe, expect, it } from 'vitest';
import { runAcceptanceChecks } from '../src/checks/index.js';
import { measureVisibility } from '../src/checks/visibility.js';
import { buildHouse } from '../src/model/house.js';

const results = runAcceptanceChecks();

describe('acceptance checks', () => {
  it('covers all eleven checks', () => {
    expect(results.map((check) => check.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it.each(results)('check $id passes: $title', (check) => {
    expect(check.failures, check.failures.join('\n')).toEqual([]);
  });

  it('measures the visibility the spec expects, within one grid cell', () => {
    for (const m of measureVisibility(buildHouse({ cutaway: true }))) {
      expect(m.percent, m.name).toBeGreaterThanOrEqual(60);
      expect(Math.abs(m.percent - m.expected), `${m.name}: ${m.percent} vs expected ${m.expected}`).toBeLessThanOrEqual(4);
    }
  });
});
