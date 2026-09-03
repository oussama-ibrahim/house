// Part 7 of the spec, run as assertions.
import { buildHouse } from '../model/house.js';
import { checkAreas } from './areas.js';
import { checkClearZones, checkClearances, checkWallContacts, checkWindowPrisms } from './furniture.js';
import { checkHandrail, checkHeadroom, checkStairAlignment, checkStairWidth } from './stair.js';
import { checkVisibility } from './visibility.js';
import { checkPartitionClipping } from './walls.js';

export function runAcceptanceChecks() {
  const full = buildHouse({ cutaway: false });
  const cutaway = buildHouse({ cutaway: true });
  return [
    checkAreas(full),
    checkHeadroom(full),
    checkStairAlignment(full),
    checkStairWidth(full),
    checkWallContacts(full),
    checkClearZones(full),
    checkWindowPrisms(full),
    checkPartitionClipping(full),
    checkVisibility(cutaway),
    checkClearances(full),
    checkHandrail(full),
  ].sort((a, b) => a.id - b.id);
}

export function formatReport(results) {
  const lines = [];
  for (const check of results) {
    lines.push(`${check.pass ? 'PASS' : 'FAIL'}  ${String(check.id).padStart(2)}  ${check.title}`);
    for (const detail of check.details) lines.push(`          ${detail}`);
    for (const failure of check.failures) lines.push(`      !!  ${failure}`);
  }
  const failed = results.filter((check) => !check.pass).length;
  lines.push(failed === 0 ? `All ${results.length} checks pass.` : `${failed} of ${results.length} checks fail.`);
  return lines.join('\n');
}
