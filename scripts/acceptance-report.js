// Prints the Part 7 acceptance report and exits non-zero if any check fails.
import { formatReport, runAcceptanceChecks } from '../src/checks/index.js';

const results = runAcceptanceChecks();
process.stdout.write(`${formatReport(results)}\n`);
process.exitCode = results.every((check) => check.pass) ? 0 : 1;
