// Prints the contractor's drawing set, the 1:50 floor plans in French, to a PDF through headless
// Chrome, so it needs no PDF library and prints exactly what the HTML lays out.
// Usage: npm run plans   (CHROME_PATH overrides where Chrome is looked for)
import { execFile } from 'node:child_process';
import { access, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { buildHouse, levelById } from '../src/model/house.js';
import { drawingSetHtml } from '../src/drawing/sheet.js';

const run = promisify(execFile);
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUTPUT = resolve('plans', 'plans-de-principe.pdf');

async function chromeOrExplain() {
  try {
    await access(CHROME);
  } catch {
    throw new Error(`Chrome not found at "${CHROME}". Install Google Chrome or set CHROME_PATH to its executable.`);
  }
}

async function printToPdf(html, output) {
  const dir = await mkdtemp(join(tmpdir(), 'house-plans-'));
  const page = join(dir, 'plans.html');
  try {
    await writeFile(page, html, 'utf8');
    await run(CHROME, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', `--print-to-pdf=${output}`, pathToFileURL(page).href]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function main() {
  await chromeOrExplain();
  const house = buildHouse({ cutaway: false });
  const site = levelById(house, 'ground').model.neighbours;
  const date = new Date().toLocaleDateString('fr-FR');
  const html = drawingSetHtml(house.levels, site, date);
  await mkdir(resolve('plans'), { recursive: true });
  await printToPdf(html, OUTPUT);
  process.stdout.write(`Drawing set written to ${OUTPUT}\n`);
}

main().catch((error) => {
  process.stderr.write(`Could not print the drawing set: ${error.message}\n`);
  process.exitCode = 1;
});
