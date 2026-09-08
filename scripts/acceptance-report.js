// Prints the Part 7 acceptance report for every design and exits non-zero if any check fails.
import { DESIGNS, DESIGN_IDS } from '../src/spec/designs.js';
import { formatReport, runAcceptanceChecks } from '../src/checks/index.js';

let allPass = true;
for (const id of DESIGN_IDS) {
  const results = runAcceptanceChecks(id);
  process.stdout.write(`=== ${DESIGNS[id].name} ===\n${formatReport(results)}\n\n`);
  allPass = allPass && results.every((check) => check.pass);
}
process.exitCode = allPass ? 0 : 1;
