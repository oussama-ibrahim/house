// The design registry. A single design for now: the 6.15 × 7.20 house with its first level 8.20 deep
// over the street. The registry stays so a variant can be added beside it again without touching the
// model, checks or viewer.
import { ROOF_FRONT } from './facades.js';
import { FIRST } from './first.js';
import { GROUND } from './ground.js';

export const DESIGNS = Object.freeze({
  a: Object.freeze({ id: 'a', name: '6.15 × 7.20 house, first level 6.15 × 8.20', levels: Object.freeze([GROUND, FIRST]), roof: ROOF_FRONT }),
});

export const DESIGN_IDS = Object.freeze(Object.keys(DESIGNS));
export const DEFAULT_DESIGN = 'a';

export function designById(id) {
  const design = DESIGNS[id];
  if (!design) throw new Error(`Unknown design "${id}"`);
  return design;
}
