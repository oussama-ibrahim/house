// The contractor's drawing set as one printable HTML document: one A3 landscape sheet per level,
// the 1:50 plan beside a title block, notes, a legend and the level's window and door schedule.
// Every figure in the notes is read from the spec, so the sheets stay in step with the design.
import {
  COLUMN,
  EXTERIOR_WALL_THICKNESS,
  FLOOR_TO_FLOOR,
  FOOTPRINT,
  PARTITION_THICKNESS,
  SLAB_OPENING,
  SLAB_THICKNESS,
  WALL_HEIGHT,
} from '../spec/global.js';
import { landingHeight, nosingLineY } from '../model/stair.js';
import { metres, planPaperSize, planSvg, tagOf } from './plan.js';
import { OPENING_KINDS, PROJECT, SHEET_TITLES, STATUS } from './vocabulary.js';

const SHEET = Object.freeze({ width: 420, height: 297, border: 10, panel: 112 });
const WALL_NAMES = Object.freeze({ north: 'Façade arrière', south: 'Façade rue', west: 'Façade ouest', east: 'Mitoyen est' });

function escape(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const cm = (m) => Math.round(m * 100);

function designation(wall, opening) {
  if (opening.kind === 'door') {
    if (!opening.leaf) return OPENING_KINDS.slidingDoor;
    return wall.exterior ? OPENING_KINDS.entrance : OPENING_KINDS.door;
  }
  if (opening.sill === 0) return OPENING_KINDS.fixed;
  return opening.type === 'high' ? OPENING_KINDS.highWindow : OPENING_KINDS.window;
}

/** The level's openings as schedule rows, windows first, each read straight from its wall. */
export function scheduleRows(spec) {
  const rows = spec.walls.flatMap((wall) =>
    wall.openings
      .filter((opening) => opening.kind !== 'column')
      .map((opening) => ({
        tag: tagOf(opening),
        kind: opening.kind,
        designation: designation(wall, opening),
        wall: WALL_NAMES[wall.id] ?? 'Cloison',
        width: opening.to - opening.from,
        height: opening.head - opening.sill,
        sill: opening.sill,
        head: opening.head,
      })),
  );
  const order = (row) => [row.kind === 'window' ? 0 : 1, Number(row.tag.slice(1))];
  return rows.sort((a, b) => order(a)[0] - order(b)[0] || order(a)[1] - order(b)[1]);
}

function commonNotes() {
  return [
    'Cotes en mètres, aux nus bruts ; à vérifier sur site avant toute exécution.',
    `Murs extérieurs ${cm(EXTERIOR_WALL_THICKNESS)} cm, cloisons ${cm(PARTITION_THICKNESS)} cm.`,
    `Hauteur sous plafond ${metres(WALL_HEIGHT)} ; dalle ${metres(SLAB_THICKNESS)} ; plancher à plancher ${metres(FLOOR_TO_FLOOR)}.`,
    `Poteaux existants C1 et C2 (${cm(COLUMN.x[1] - COLUMN.x[0])} × ${cm(COLUMN.z[1] - COLUMN.z[0])} cm) conservés, de la fondation à la toiture.`,
    'Structure, encorbellement, étanchéité et réseaux à faire valider par un ingénieur (BET).',
    'Mobilier indicatif ; les éléments intégrés (dressings, niche, cuisine) font partie des travaux.',
  ];
}

function groundNotes(spec) {
  const { stair } = spec;
  const risers = stair.starter.risers + stair.risers;
  const notes = [
    `Escalier métallique : ${risers} contremarches de ${metres(stair.riser)} (${stair.starter.risers} + ${stair.risers}), giron ${metres(stair.going)}, palier à ${metres(landingHeight(stair))}.`,
  ];
  const zone = spec.clearZones.find((z) => z.opening === 'D3');
  if (zone) {
    const under = stair.steel.stringer.belowNosing + stair.steel.stringer.depth;
    const approach = zone.z[1] - SLAB_OPENING.z[0];
    notes.push(`Porte cuisine P3 sous la volée : hauteur libre ${metres(nosingLineY(stair, SLAB_OPENING.z[0]) - under)} au droit de la porte, ${metres(nosingLineY(stair, zone.z[1]) - under)} à ${metres(approach)} devant.`);
  }
  notes.push('Garage des parents hors projet ; sa dalle de toiture prolonge le plancher de l’étage jusqu’au nu de la façade.');
  return notes;
}

function firstNotes(spec) {
  const terraceDoor = spec.walls.find((w) => w.id === 'east')?.openings.find((o) => o.kind === 'door');
  const notes = [
    `Encorbellement de ${metres(spec.size[1] - FOOTPRINT.depth)} sur rue : vérifier la règle de saillie du PAU avant dépôt du permis.`,
    `Trémie existante ${metres(SLAB_OPENING.x[1] - SLAB_OPENING.x[0])} × ${metres(SLAB_OPENING.z[1] - SLAB_OPENING.z[0])}, conservée.`,
    'Dressings intégrés toute hauteur ; le poteau C2 est habillé dans le dressing de la chambre 1.',
  ];
  if (terraceDoor) {
    notes.push(`Porte-terrasse ${tagOf(terraceDoor)} : seuil de plain-pied sur le toit du garage ; prévoir un relevé d’étanchéité d’au moins 0,15 et l’accord des parents.`);
  }
  return notes;
}

function scheduleTable(spec) {
  const rows = scheduleRows(spec)
    .map((r) => `<tr><td><b>${r.tag}</b></td><td>${escape(r.designation)}</td><td>${escape(r.wall)}</td><td>${metres(r.width)}</td><td>${metres(r.height)}</td><td>${metres(r.sill)}</td><td>${metres(r.head)}</td></tr>`)
    .join('');
  return `<table class="schedule"><thead><tr><th>Rep.</th><th>Désignation</th><th>Mur</th><th>L</th><th>H</th><th>Allège</th><th>HSL</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function legend() {
  const swatch = (style) => `<svg width="9mm" height="4mm" viewBox="0 0 9 4"><rect x="0.3" y="0.3" width="8.4" height="3.4" ${style}/></svg>`;
  const items = [
    [swatch('fill="#3b3a38"'), 'Mur, cloison (coupé)'],
    [swatch('fill="#1d1d1b"'), 'Poteau existant'],
    [swatch('fill="#efebe4" stroke="#1d1d1b" stroke-width="0.25"'), 'Élément intégré, appareil sanitaire'],
    [swatch('fill="none" stroke="#8a8782" stroke-width="0.25"'), 'Mobilier indicatif'],
    [swatch('fill="none" stroke="#8a8782" stroke-width="0.25" stroke-dasharray="1 0.6"'), 'Au-dessus du plan de coupe'],
  ];
  return `<div class="legend">${items.map(([s, label]) => `<div>${s}<span>${escape(label)}</span></div>`).join('')}</div>`;
}

function titleBlock(spec, index, total, date) {
  return `<div class="title">
    <div class="project">${escape(PROJECT)}</div>
    <div class="sheet-title">${escape(SHEET_TITLES[spec.id] ?? spec.name)}</div>
    <div class="meta"><span>Échelle 1:50 (A3)</span><span>Planche ${index}/${total}</span><span>Indice A — ${escape(date)}</span></div>
    <div class="status">${escape(STATUS)}</div>
  </div>`;
}

function sheet(level, site, index, total, date) {
  const svg = planSvg(level, site);
  const [width, height] = planPaperSize(svg);
  const area = { width: SHEET.width - SHEET.panel - 3 * SHEET.border, height: SHEET.height - 2 * SHEET.border };
  if (width > area.width || height > area.height) {
    throw new Error(`The ${level.spec.id} plan is ${width.toFixed(0)} × ${height.toFixed(0)} mm at 1:50; the sheet leaves ${area.width} × ${area.height} mm`);
  }
  const notes = [...commonNotes(), ...(level.spec.stair ? groundNotes(level.spec) : firstNotes(level.spec))];
  return `<section class="page">
    <div class="drawing">${svg}</div>
    <aside class="panel">
      <h2>Notes</h2>
      <ol>${notes.map((n) => `<li>${escape(n)}</li>`).join('')}</ol>
      <h2>Menuiseries</h2>
      ${scheduleTable(level.spec)}
      <p class="schedule-key">L largeur, H hauteur, HSL hauteur sous linteau, depuis le sol fini.</p>
      <h2>Légende</h2>
      ${legend()}
      ${titleBlock(level.spec, index, total, date)}
    </aside>
  </section>`;
}

const STYLE = `
  @page { size: ${SHEET.width}mm ${SHEET.height}mm; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Helvetica, Arial, sans-serif; color: #1d1d1b; }
  .page { position: relative; width: ${SHEET.width}mm; height: ${SHEET.height}mm; page-break-after: always; overflow: hidden; }
  .page::before { content: ''; position: absolute; inset: ${SHEET.border}mm; border: 0.5mm solid #1d1d1b; }
  .drawing { position: absolute; left: ${SHEET.border}mm; top: ${SHEET.border}mm; bottom: ${SHEET.border}mm;
    right: ${SHEET.panel + SHEET.border}mm; display: flex; align-items: center; justify-content: center; }
  .panel { position: absolute; top: ${SHEET.border}mm; right: ${SHEET.border}mm; bottom: ${SHEET.border}mm; width: ${SHEET.panel}mm;
    border-left: 0.35mm solid #1d1d1b; padding: 4mm 5mm; display: flex; flex-direction: column; font-size: 7.4pt; line-height: 1.3; }
  h2 { font-size: 8.5pt; margin: 2.5mm 0 1.2mm; text-transform: uppercase; letter-spacing: 0.06em; }
  ol { margin: 0; padding-left: 4.5mm; } li { margin-bottom: 0.8mm; }
  .schedule { width: 100%; border-collapse: collapse; font-size: 6.8pt; }
  .schedule th, .schedule td { border: 0.2mm solid #8a8782; padding: 0.5mm 1mm; text-align: left; }
  .schedule th { background: #efebe4; }
  .schedule-key { margin: 1mm 0 0; font-size: 6.4pt; color: #5a5752; }
  .legend div { display: flex; align-items: center; gap: 2mm; margin-bottom: 0.6mm; }
  .title { margin-top: auto; border-top: 0.35mm solid #1d1d1b; padding-top: 2.5mm; }
  .project { font-size: 8pt; color: #5a5752; }
  .sheet-title { font-size: 13pt; font-weight: bold; margin: 1mm 0 1.5mm; }
  .meta { display: flex; justify-content: space-between; font-size: 7.4pt; }
  .status { margin-top: 2mm; padding: 1.2mm 1.5mm; border: 0.3mm solid #1d1d1b; font-weight: bold; font-size: 7.4pt; }
`;

/**
 * The whole set as one HTML document. `levels` are built levels ({ spec, model }), ground first;
 * `site` is the ground level's neighbours; `date` is printed in the title block.
 */
export function drawingSetHtml(levels, site, date) {
  const pages = levels.map((level, i) => sheet(level, site, i + 1, levels.length, date)).join('');
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${escape(PROJECT)} — plans</title><style>${STYLE}</style></head><body>${pages}</body></html>`;
}
