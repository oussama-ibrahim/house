// Prints the build specification as Markdown, generated from the spec data so the tables can
// never drift from what the model builds and the checks measure.
// Usage: npm run spec-doc > scope-v3.md   (an optional design id selects a registry entry)
import {
  CAMERA,
  CHECKS,
  COLOURS,
  CUTAWAY_WALL_HEIGHT,
  EXTERIOR_WALL_THICKNESS,
  FLOOR_TO_FLOOR,
  GLAZING_OPACITY,
  INTERIOR,
  PARTITION_THICKNESS,
  SLAB_THICKNESS,
  WALL_HEIGHT,
  WINDOW_TYPES,
  WORLD_PLACEMENT,
} from '../src/spec/global.js';
import { roomRects } from '../src/spec/helpers.js';
import { STAIR } from '../src/spec/stair.js';
import { boxFromPart } from '../src/model/box.js';
import { roomArea } from '../src/model/floors.js';
import { designById } from '../src/spec/designs.js';
import { grossAreaOf, interiorOf } from '../src/spec/helpers.js';
import { levelSpecs } from '../src/model/house.js';
import { handrailBox, handrailCentrelineY, landingHeight, starterRect, stringerBoxes } from '../src/model/stair.js';

const DESIGN = designById(process.argv[2] ?? 'a');
const LEVEL_SPECS = levelSpecs(DESIGN.id);

const m = (value) => value.toFixed(2);
const range = ([a, b]) => `${m(a)} – ${m(b)}`;
const rect = (r) => `x ${range(r.x)}, z ${range(r.z)}`;

function table(headers, rows) {
  return [`| ${headers.join(' | ')} |`, `|${headers.map(() => '---').join('|')}|`, ...rows.map((row) => `| ${row.join(' | ')} |`)].join('\n');
}

function wallLabel(wall) {
  const across = wall.axis === 'x' ? 'z' : 'x';
  return `${wall.id}, ${across} ${m(wall.at)}`;
}

function wallsSection(spec) {
  const partitions = spec.walls.filter((wall) => !wall.exterior && !wall.column);
  const columns = spec.walls.filter((wall) => wall.column);
  const along = (wall) => `${wall.axis} ${range([wall.from, wall.to])}`;
  const thickness = (wall) => (Math.abs(wall.thickness - PARTITION_THICKNESS) < 1e-9 ? '' : `, ${m(wall.thickness)} thick`);
  const lines = [
    `### Partitions (thickness ${m(PARTITION_THICKNESS)} unless noted, height ${m(WALL_HEIGHT)}, clipped to the interior envelope)`,
    '',
    table(['Ref', 'Centreline', 'Extent'], partitions.map((wall) => [wall.id, `${wall.axis === 'x' ? 'z' : 'x'} = ${m(wall.at)}`, `${along(wall)}${thickness(wall)}`])),
  ];
  if (columns.length) {
    lines.push('', '### Columns (structural, floor to slab, same position on both levels)', '');
    lines.push(table(['Ref', 'Extent', 'Section'], columns.map((wall) => [
      wall.id,
      `x ${range([wall.from, wall.to])}, z ${range([wall.at - wall.thickness / 2, wall.at + wall.thickness / 2])}`,
      `${m(wall.to - wall.from)} × ${m(wall.thickness)}`,
    ])));
  }
  return lines.join('\n');
}

function openingsSection(spec) {
  const rows = [];
  for (const wall of spec.walls) {
    for (const opening of [...wall.openings].sort((a, b) => a.from - b.from)) {
      if (opening.kind === 'column') {
        rows.push([opening.id, wallLabel(wall), `${wall.axis} ${range([opening.from, opening.to])}`, m(opening.to - opening.from), '—', '—', 'structural column in the wall line']);
        continue;
      }
      const kind = opening.kind === 'door' ? (opening.leaf ? 'door' : 'opening, no leaf') : opening.head >= WALL_HEIGHT ? 'glazed to ceiling' : 'window';
      rows.push([opening.id, wallLabel(wall), `${wall.axis} ${range([opening.from, opening.to])}`, m(opening.to - opening.from), m(opening.sill), m(opening.head), kind]);
    }
  }
  const blind = spec.walls.filter((wall) => wall.exterior && !wall.column && wall.openings.length === 0).map((wall) => wall.id);
  return [
    '### Openings',
    '',
    table(['Ref', 'Wall', 'Position along wall', 'Width', 'Sill', 'Head', 'Kind'], rows),
    '',
    blind.length ? `Blind walls, no openings: ${blind.join(', ')}.` : 'Every exterior wall carries at least one opening.',
  ].join('\n');
}

function roomsSection(spec) {
  const rows = spec.rooms.map((room) => {
    const [main, ...extra] = roomRects(room);
    const shape = extra.length ? `${rect(main)}, plus ${extra.map(rect).join(' and ')}` : rect(main);
    return [room.name, shape, room.finish ?? '—', `${roomArea(room).toFixed(2)} (table ${room.tableArea.toFixed(1)})`];
  });
  const net = spec.rooms.reduce((sum, room) => sum + roomArea(room), 0);
  return [
    '### Rooms (interior faces)',
    '',
    table(['Room', 'Extent', 'Finish', 'Net m²'], rows),
    '',
    `Footprint ${m(spec.size[0])} × ${m(spec.size[1])} m, gross ${grossAreaOf(spec).toFixed(2)} m² to the exterior face; net ${net.toFixed(2)} m² (table ${spec.netArea.toFixed(1)}).`,
  ].join('\n');
}

function zonesSection(spec) {
  return ['### Clear zones — no furniture may enter these', '', table(['Opening', 'Clear zone'], spec.clearZones.map((zone) => [zone.opening, rect(zone)]))].join('\n');
}

function furnitureRows(pieces) {
  return pieces.map((piece) => {
    const boxes = piece.parts.map((part, i) => boxFromPart(`${i}`, part, piece.material));
    const [first] = piece.parts;
    const extent = `x ${range([Math.min(...boxes.map((b) => b.min[0])), Math.max(...boxes.map((b) => b.max[0]))])}, z ${range([Math.min(...boxes.map((b) => b.min[2])), Math.max(...boxes.map((b) => b.max[2]))])}`;
    const size = piece.parts.length > 1 ? `${piece.parts.length} boxes` : `${m(first.size[0])} × ${m(first.size[1])} × ${m(first.size[2])}${first.y0 ? `, from y ${m(first.y0)}` : ''}`;
    return [piece.name, size, `${m(first.centre[0])}, ${m(first.centre[1])}`, piece.touches.length ? piece.touches.join(', ') : '—', extent];
  });
}

function furnitureSection(spec) {
  return [
    '### Furniture (position = centre, footprint w × d, height from floor)',
    '',
    'A piece may touch a wall face only where the `Touches` column says so. Everywhere else the minimum gap to any wall face is 0.05 m.',
    '',
    table(['Piece', 'w × d × h', 'Centre (x, z)', 'Touches', 'Extent'], furnitureRows(spec.furniture)),
    '',
    '### Dressing (rendered only, never measured)',
    '',
    table(['Piece', 'w × d × h', 'Centre (x, z)', 'Touches', 'Extent'], furnitureRows(spec.dressing ?? [])),
  ].join('\n');
}

function clearancesSection(spec) {
  const rows = spec.clearances.map((sweep) => {
    const other = sweep.axis === 'x' ? 'z' : 'x';
    const direction = sweep.axis === 'x' ? (sweep.direction > 0 ? 'east' : 'west') : sweep.direction > 0 ? 'south' : 'north';
    return [sweep.label, `${sweep.axis} = ${m(sweep.at)}, ${direction}ward`, `${other} ${range(sweep.span)}`, m(CHECKS.minClearance), m(sweep.expected)];
  });
  return ['### Clearances (check 10)', '', table(['In front of', 'From', 'Over', 'Minimum', 'Expected'], rows)].join('\n');
}

function levelSection(spec, index) {
  return [
    `## Part ${index} — ${spec.name}`,
    '',
    roomsSection(spec),
    '',
    wallsSection(spec),
    '',
    openingsSection(spec),
    '',
    zonesSection(spec),
    '',
    furnitureSection(spec),
    '',
    clearancesSection(spec),
  ].join('\n');
}

/** How far the first level's slab cantilevers over the street beyond the ground level's south face. */
function overhangNote() {
  const [ground, first] = LEVEL_SPECS;
  const overhang = first.size[1] - ground.size[1];
  if (overhang <= 0) return 'Both levels are the same depth.';
  return `**Overhang.** The first level is ${m(overhang)} m deeper than the ground level: its slab cantilevers that far over the street beyond the ground level's south face. Both levels keep their origin at the shared north-west corner, so the stair void and the arrival use the same z coordinates on both.`;
}

function stairSection() {
  const rail = STAIR.handrail;
  const box = handrailBox(STAIR);
  const base = landingHeight(STAIR);
  const starter = starterRect(STAIR);
  const topZ = STAIR.bottomZ - STAIR.going * STAIR.treadCount;
  const totalRisers = STAIR.starter.risers + STAIR.risers;
  return [
    '## Part 3 — Staircase',
    '',
    'This governs both levels. Build it first. A quarter-turn stair fitted to the first-floor slab as built: its opening is 3.00 m long and ends 1.80 m from the first level\'s street wall. A starter leg along the front wall and a low landing in the south-east corner sit under the slab; the main flight climbs north against the party wall and fills the opening exactly.',
    '',
    table(['Item', 'Value'], [
      ['Risers', `${totalRisers} × ${STAIR.riser.toFixed(3)} = ${(totalRisers * STAIR.riser).toFixed(3)} m: ${STAIR.starter.risers} up to the landing, ${STAIR.risers} on the main flight`],
      ['Starter leg', `climbs eastward from x ${m(starter.x[0])} to ${m(starter.x[1])}, z ${range(starter.z)}; ${STAIR.starter.risers - 1} treads of ${STAIR.starter.going.toFixed(3)} m, tops at y = \`${m(STAIR.riser)}n\`, approached head-on from the living room`],
      ['Landing', `x ${range(STAIR.x)}, z ${range(STAIR.landing.z)}, top at y ${m(base)}, a plate on a steel frame and four posts`],
      ['Main flight strip', `x ${range(STAIR.x)}, clear width ${m(STAIR.x[1] - STAIR.x[0])} m`],
      ['Main flight', `climbs northward from the landing, bottom at z = ${m(STAIR.bottomZ)}; ${STAIR.treadCount} × ${STAIR.going.toFixed(3)} = ${(STAIR.treadCount * STAIR.going).toFixed(3)} m run, extent z ${range([topZ, STAIR.bottomZ])}`],
      [`Main tread *n* (n = 1…${STAIR.treadCount})`, `x ${range(STAIR.x)}, z from \`${m(STAIR.bottomZ)} − ${m(STAIR.going)}n\` to \`${m(STAIR.bottomZ)} − ${m(STAIR.going)}(n−1)\`, top at y = \`${m(base)} + ${m(STAIR.riser)}n\``],
      ['Top of flight', `main tread ${STAIR.treadCount} top at y ${m(base + STAIR.riser * STAIR.treadCount)}, z ${range([topZ, topZ + STAIR.going])}; riser ${totalRisers} lands on the upper floor at y ${m(FLOOR_TO_FLOOR)}`],
    ]),
    '',
    `**Steel stair.** Every tread is a ${m(STAIR.steel.treadThickness)} m plate in ${STAIR.steel.treadMaterial} with open risers, carried on ${m(STAIR.steel.stringer.depth)} × ${m(STAIR.steel.stringer.thickness)} steel stringers whose top edge runs ${m(STAIR.steel.stringer.belowNosing)} m under the nosing line: two under the main flight at x ${stringerBoxes(STAIR).slice(0, 2).map((s) => m(s.centre[0])).join(' and ')}, from the landing to the slab edge, and two under the starter leg at z ${stringerBoxes(STAIR).slice(2).map((s) => m(s.centre[2])).join(' and ')}. The landing is a plate at y ${m(base)} on a ${m(STAIR.steel.stringer.depth)} m frame carried by four ${m(STAIR.guard.post)} m posts. Only the top main tread rises above the ${m(WALL_HEIGHT)} m wall height, topping out at ${m(base + STAIR.riser * STAIR.treadCount)} inside the slab zone; do not clip it.`,
    '',
    `**Under the stair.** Open to the living room under both legs and the landing: no wall along the main flight's west side, only the guard. The TV unit stands against the party wall under the high end of the flight.`,
    '',
    `**Headroom.** The underside of the upper slab is at ${m(WALL_HEIGHT)}. A step needs ${m(CHECKS.minHeadroom)} m clear, so only steps with a top at or below ${m(WALL_HEIGHT - CHECKS.minHeadroom)} m may sit under a slab: the starter leg and the landing, at ${m(base)}, do, under bedroom 1's floor. The void is the slab opening and covers the whole main flight.`,
    '',
    `**Arrival.** Riser ${totalRisers} lands at z = ${m(topZ)}, stepping north onto the landing at x ${range(STAIR.x)}, z ${range([topZ - STAIR.arrivalDepth, topZ])}, kept clear one flight width deep. The whole north edge of the void is the arrival opening; no railing there. The main flight has the ${rail.side} wall on one side and, on the ${STAIR.guard.side}, a guard of ${m(STAIR.guard.post)} m posts on every ${STAIR.guard.postEvery === 3 ? 'third' : `${STAIR.guard.postEvery}th`} tread under a ${m(STAIR.guard.section)} m rail at handrail height; the starter leg carries the same guard along its open north side, and the two rails meet at a newel on the landing's corner.`,
    '',
    '### Handrail',
    '',
    table(['Item', 'Value'], [
      ['Wall', `${rail.side} wall, centreline x ${m(box.centre[0])} (${m(rail.wallOffset)} off the face)`],
      ['Section', `${m(rail.section)} × ${m(rail.section)}`],
      ['Extent', `z ${m(rail.zFrom)} to z ${m(rail.zTo)}, the main flight only`],
      ['Height', `centreline ${m(rail.aboveNosing)} above the nosing line: \`y = ${m(STAIR.riser / STAIR.going)} × (${m(STAIR.bottomZ)} − z) + ${m(base + STAIR.riser + rail.aboveNosing)}\``],
      ['Box', `length ${box.size[2].toFixed(3)} m, centre (${box.centre.map(m).join(', ')}), \`rotation.x = +${box.rotationX.toFixed(4)} rad\`, north end high`],
    ]),
    '',
    `Check: at z ${m(STAIR.bottomZ)} the rail is at ${m(handrailCentrelineY(STAIR, STAIR.bottomZ))}, ${m(rail.aboveNosing)} above nosing 1; at z ${m(rail.zTo)} it is at ${m(handrailCentrelineY(STAIR, rail.zTo))}. The handrail is exempt from check 7 and is hidden whenever its wall is cut.`,
  ].join('\n');
}

function checksSection() {
  const expectedVisibility = LEVEL_SPECS.flatMap((spec) =>
    spec.visibilityTargets.map((target) => `${spec.furniture.find((piece) => piece.id === target.id).name.toLowerCase()} ${target.expected} %`),
  );
  return [
    '## Part 7 — Acceptance checks',
    '',
    'Run these as assertions, not as a reading exercise. `npm test` runs all of them; `npm run check` prints the report.',
    '',
    `1. Gross area per level = footprint width × depth (${LEVEL_SPECS.map((spec) => `${spec.name.toLowerCase()} ${grossAreaOf(spec).toFixed(2)} m²`).join(', ')}). Net areas match the room tables within ${CHECKS.netAreaTolerance} m².`,
    `2. For every step, if any slab box overlaps its x–z extent, its top must leave ${m(CHECKS.minHeadroom)} m under the ${m(WALL_HEIGHT)} m slab underside. The starter leg and the landing sit under bedroom 1's floor; the main flight is under the void.`,
    '3. The first-level void, the slab opening as built, covers the main flight exactly; the landing and the starter leg lie outside it under a slab, and the arrival sits inside a finished room and over a single ground-level room (allowing for the partition along its edge).',
    `4. The main flight strip is ${m(STAIR.x[1] - STAIR.x[0])} m clear, a wall face or the guard on each flank, and no step box extends outside its leg.`,
    `5. No furniture bounding box intersects any wall box. A furniture box may touch a wall face only where its \`Touches\` column says so; elsewhere the minimum gap is ${m(CHECKS.minWallGap)} m.`,
    '6. No furniture bounding box intersects any clear zone.',
    `7. No opaque furniture box intersects the vertical prism of any window opening: the opening span × sill-to-head height × ${m(CHECKS.windowPrismDepth)} m into the room. Transparent elements (glazing, shower screens, the handrail) are exempt.`,
    `8. Every partition is clipped to the level's interior envelope (${m(INTERIOR.min)} in from every facade), so no partition end face is coplanar with a facade.`,
    `9. Visibility. Sample a ${CHECKS.visibilityGrid} × ${CHECKS.visibilityGrid} grid on each target's top face and cast a ray to the default camera in cutaway mode (every wall at ${m(CUTAWAY_WALL_HEIGHT)} m). Occluders are wall, slab and tread boxes only. Assert ${CHECKS.minVisibility} % or more unobstructed. Expected: ${expectedVisibility.join(', ')}.`,
    `10. In front of each wardrobe, WC and shower entry, over the full width, the clear distance to the nearest furniture or wall is at least ${m(CHECKS.minClearance)} m (expected values in the clearance tables).`,
    `11. The handrail centreline is ${m(STAIR.handrail.aboveNosing)} m above every tread nosing, and its underside clears every tread.`,
  ].join('\n');
}

const parts = [
  `# 3D house model — build spec v3, ${DESIGN.name}`,
  '',
  `Two-storey house: ${LEVEL_SPECS.map((spec) => `${spec.name.toLowerCase()} ${m(spec.size[0])} × ${m(spec.size[1])} m (${grossAreaOf(spec).toFixed(2)} m² gross)`).join(', ')}. This document is generated from the model's spec data (\`npm run spec-doc${DESIGN.id === 'a' ? '' : ` ${DESIGN.id}`}\`); it supersedes v2.1.`,
  '',
  '**Site constraint.** The east wall stands against the neighbouring house (on the right, seen from the street). It carries no windows on the ground level; the first level may have them. The stair runs along it.',
  '',
  '## Part 1 — Prompt to give your dev agent',
  '',
  '> Build an interactive 3D model of a small two-storey house using Three.js (r150+, ES modules, `OrbitControls`).',
  '>',
  '> Render into a container div that fills the parent width, height 480 px. Transparent renderer background (`alpha: true`), with a `ShadowMaterial` plane at y = −0.30 to catch shadows. Lighting: `HemisphereLight` (sky `#ffffff`, ground `#9d978c`, intensity 0.8) and one `DirectionalLight` (`#fff2e0`, intensity 0.8) at (10, 16, 8), shadows on, 1024 map, orthographic shadow camera bounds ±14.',
  '>',
  '> Model the two levels as two groups placed side by side, ground level to the west, first level to the east, so both interiors are visible at once. No ceilings.',
  '>',
  '> Every wall, slab, tread and furniture piece is a `BoxGeometry` mesh with `MeshLambertMaterial`. No CSG. Build openings by splitting each wall into segments: a wall carries a list of openings, so write a generic splitter that walks the wall\'s length and emits a pier between each pair of openings, plus a sill block below and a lintel block above each opening. An opening may sit flush against the end of its wall; the splitter must emit a zero-length pier without error. A window whose head is the wall top has no lintel: that is how the glazed kitchen partition is built. Put a thin translucent box in each window opening as glazing.',
  '>',
  `> View modes: **section** (default; exterior walls facing the camera render at ${m(CUTAWAY_WALL_HEIGHT)} m, the rest full height with glazing), **cutaway** (every wall at ${m(CUTAWAY_WALL_HEIGHT)} m, glazing and handrail hidden) and **full** (${m(WALL_HEIGHT)} m walls, glazing and handrail). Buttons for both levels / ground only / first only / reset view, plus a lifted flat roof and a label layer as toggles.`,
  '>',
  '> All dimensions are metres. Coordinate system per level: X east, Z south, Y up, origin at the north-west corner of the exterior face, y = 0 at the finished floor surface of that level.',
  '>',
  `> Controls: left-drag orbits, scroll zooms (clamp distance ${CAMERA.minDistance}–${CAMERA.maxDistance} m), no panning. Default camera azimuth ${CAMERA.azimuth} rad, polar ${CAMERA.polar} rad, distance ${CAMERA.distance} m, target (${CAMERA.target.join(', ')}). \`touch-action: none\` on the canvas, pointer events, handle window resize.`,
  '',
  '## Part 2 — Global',
  '',
  table(['Item', 'Value'], [
    ...LEVEL_SPECS.map((spec) => [`Footprint, ${spec.name.toLowerCase()}`, `${m(spec.size[0])} × ${m(spec.size[1])} m, ${grossAreaOf(spec).toFixed(2)} m² gross; interior x ${m(interiorOf(spec).min)}–${m(interiorOf(spec).xMax)}, z ${m(interiorOf(spec).min)}–${m(interiorOf(spec).zMax)}`]),
    ['Exterior wall thickness', `${m(EXTERIOR_WALL_THICKNESS)} m`],
    ['Interior partition thickness', `${m(PARTITION_THICKNESS)} m`],
    ['Wall height, floor to underside of slab', `${m(WALL_HEIGHT)} m`],
    ['Slab + floor build-up', `${m(SLAB_THICKNESS)} m`],
    ['Floor to floor', `${m(FLOOR_TO_FLOOR)} m`],
    ['Cutaway wall height', `${m(CUTAWAY_WALL_HEIGHT)} m`],
  ]),
  '',
  `Exterior wall centrelines sit ${m(EXTERIOR_WALL_THICKNESS / 2)} in from each facade; finished interior faces ${m(INTERIOR.min)} in. North and south walls run the full width; west and east butt against them.`,
  '',
  overhangNote(),
  '',
  '### Window family',
  '',
  'Every window is one of these types; a level chooses only where each starts along its wall. Heads share one line, a 0.20 m lintel under the slab, except the stair slot, which runs to the wall top.',
  '',
  table(['Type', 'Width', 'Sill', 'Head', 'Used for'], [
    ['room', m(WINDOW_TYPES.room.width), m(WINDOW_TYPES.room.sill), m(WINDOW_TYPES.room.head), 'living room and bedrooms, sofa and bed height beneath'],
    ['high', m(WINDOW_TYPES.high.width), m(WINDOW_TYPES.high.sill), m(WINDOW_TYPES.high.head), 'WC, shower room, landing'],
    ['kitchen', m(WINDOW_TYPES.kitchen.width), m(WINDOW_TYPES.kitchen.sill), m(WINDOW_TYPES.kitchen.head), 'over the worktop'],
    ['roomNarrow', m(WINDOW_TYPES.roomNarrow.width), m(WINDOW_TYPES.roomNarrow.sill), m(WINDOW_TYPES.roomNarrow.head), 'the living room\'s street window, between the corner and the front door'],
    ['slot', m(WINDOW_TYPES.slot.width), m(WINDOW_TYPES.slot.sill), m(WINDOW_TYPES.slot.head), 'the stair slot on the ground level, fixed laminated glass over the landing'],
  ]),
  '',
  `**Y convention.** Per level, y = 0 is the finished floor surface. The slab occupies y −${m(SLAB_THICKNESS)} to 0.00. Walls run y 0.00 to ${m(WALL_HEIGHT)}. Both levels are modelled at the same y, side by side.`,
  '',
  `**World placement.** Build each level in local coordinates from its north-west corner, then place the ground group at world (${WORLD_PLACEMENT.ground.join(', ')}) and the first-floor group at (${WORLD_PLACEMENT.first.join(', ')}).`,
  '',
  stairSection(),
  '',
  ...LEVEL_SPECS.map((spec, i) => `${levelSection(spec, 4 + i)}\n`),
  '## Part 6 — Materials',
  '',
  table(['Element', 'Hex'], [
    ['Walls (interior faces)', `\`${COLOURS.wall}\``],
    ['Street front: render on every outer face, the frame and the parapets', `\`${COLOURS.beige}\``],
    ['Street front: panels round the two street windows', `\`${COLOURS.lightBeige}\``],
    ['Street front: pier, planters, entrance step', `\`${COLOURS.darkMarble}\``],
    ['Street front: slats, front door, soffit under the top band', `\`${COLOURS.woodSlat}\``],
    ['Street front: slat backing, panel over the door, wall light', `\`${COLOURS.joint}\``],
    ['Street front: LED lines and downlights', `\`${COLOURS.light}\``],
    ['Street front: planting', `\`${COLOURS.leaf}\``],
    ['Slab, structure, stair, worktops', `\`${COLOURS.structure}\``],
    ['Wood floor (bedrooms)', `\`${COLOURS.wood}\``],
    ['Tiled floor (wet rooms, stair)', `\`${COLOURS.tile}\``],
    ['Marble-look tile (living, kitchen, landing, corridor)', `\`${COLOURS.marble}\``],
    ['Joinery, wardrobes, tables, doors, handrail', `\`${COLOURS.joinery}\``],
    ['Upholstery', `\`${COLOURS.upholstery}\``],
    ['Bedding', `\`${COLOURS.bedding}\``],
    ['Sanitary fittings, kitchen cabinets', `\`${COLOURS.fittings}\``],
    ['Appliances (fridge, hob, sink, TV)', `\`${COLOURS.appliance}\``],
    ['Glazing, shower screens', `\`${COLOURS.glazing}\`, opacity ${GLAZING_OPACITY}`],
    ['Window and screen frames', `\`${COLOURS.frame}\``],
  ]),
  '',
  'Fixed scene colours. Do not swap them for light/dark theme variables.',
  '',
  checksSection(),
  '',
];

process.stdout.write(`${parts.join('\n')}\n`);
