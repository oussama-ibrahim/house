// Prints the build specification as Markdown, generated from the spec data so the tables can
// never drift from what the model builds and the checks measure. Usage: npm run spec-doc > scope-v3.md
import {
  CAMERA,
  CHECKS,
  COLOURS,
  CUTAWAY_WALL_HEIGHT,
  EXTERIOR_WALL_THICKNESS,
  FLOOR_TO_FLOOR,
  FOOTPRINT,
  GLAZING_OPACITY,
  GROSS_AREA,
  INTERIOR,
  PARTITION_THICKNESS,
  SLAB_THICKNESS,
  WALL_HEIGHT,
  WORLD_PLACEMENT,
} from '../src/spec/global.js';
import { roomRects } from '../src/spec/helpers.js';
import { STAIR } from '../src/spec/stair.js';
import { boxFromPart } from '../src/model/box.js';
import { roomArea } from '../src/model/floors.js';
import { LEVEL_SPECS } from '../src/model/house.js';
import { handrailBox, handrailCentrelineY } from '../src/model/stair.js';

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
  const partitions = spec.walls.filter((wall) => !wall.exterior);
  const along = (wall) => `${wall.axis} ${range([wall.from, wall.to])}`;
  return [
    `### Partitions (thickness ${m(PARTITION_THICKNESS)}, height ${m(WALL_HEIGHT)}, clipped to the interior envelope)`,
    '',
    table(['Ref', 'Centreline', 'Extent'], partitions.map((wall) => [wall.id, `${wall.axis === 'x' ? 'z' : 'x'} = ${m(wall.at)}`, along(wall)])),
  ].join('\n');
}

function openingsSection(spec) {
  const rows = [];
  for (const wall of spec.walls) {
    for (const opening of [...wall.openings].sort((a, b) => a.from - b.from)) {
      const kind = opening.kind === 'door' ? (opening.leaf ? 'door' : 'opening, no leaf') : opening.head >= WALL_HEIGHT ? 'glazed to ceiling' : 'window';
      rows.push([opening.id, wallLabel(wall), `${wall.axis} ${range([opening.from, opening.to])}`, m(opening.to - opening.from), m(opening.sill), m(opening.head), kind]);
    }
  }
  const blind = spec.walls.filter((wall) => wall.exterior && wall.openings.length === 0).map((wall) => wall.id);
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
    `Gross ${GROSS_AREA.toFixed(2)} m² to the exterior face; net ${net.toFixed(2)} m² (table ${spec.netArea.toFixed(1)}).`,
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

function stairSection() {
  const rail = STAIR.handrail;
  const box = handrailBox(STAIR);
  const topZ = STAIR.bottomZ - STAIR.going * STAIR.treadCount;
  return [
    '## Part 3 — Staircase',
    '',
    'This governs both levels. Build it first.',
    '',
    table(['Item', 'Value'], [
      ['Strip', `x ${range(STAIR.x)}, clear width ${m(STAIR.x[1] - STAIR.x[0])} m`],
      ['Direction', `climbs northward, bottom at z = ${m(STAIR.bottomZ)}`],
      ['Risers', `${STAIR.risers} × ${STAIR.riser.toFixed(3)} = ${(STAIR.risers * STAIR.riser).toFixed(3)} m`],
      ['Treads', `${STAIR.treadCount} × ${STAIR.going.toFixed(3)} = ${(STAIR.treadCount * STAIR.going).toFixed(3)} m run`],
      ['Flight extent', `z ${range([topZ, STAIR.bottomZ])}`],
      ['Tread *n* (n = 1…15)', `x ${range(STAIR.x)}, z from \`${m(STAIR.bottomZ)} − ${m(STAIR.going)}n\` to \`${m(STAIR.bottomZ)} − ${m(STAIR.going)}(n−1)\`, top at y = \`${m(STAIR.riser)}n\``],
      ['Top of flight', `tread 15 top at y ${m(STAIR.riser * 15)}, z ${range([topZ, topZ + STAIR.going])}; riser 16 lands on the upper floor at y ${m(FLOOR_TO_FLOOR)}`],
    ]),
    '',
    `Model each tread as a box from y = \`max(0, ${m(STAIR.riser)}n − ${m(STAIR.underside)})\` to \`${m(STAIR.riser)}n\`: a cast flight one riser plus a ${m(STAIR.underside - STAIR.riser)} m waist thick, so the space under the upper treads is free. Only tread 15 rises above the 2.60 m wall height, topping out at 2.70 inside the slab zone; do not clip it.`,
    '',
    `**Store under the stair.** The wedge under the upper treads, x ${range(LEVEL_SPECS[0].understair.x)}, z ${range(LEVEL_SPECS[0].understair.z)}, is a cupboard reached from the living room through ${LEVEL_SPECS[0].understair.door} in P3. Its soffit runs from 2.30 m at the top end down to 1.20 m at z ${m(LEVEL_SPECS[0].understair.z[1])}; the door head must clear the soffit over the door's whole width.`,
    '',
    `**Headroom.** The underside of the upper slab is at ${m(WALL_HEIGHT)}. A tread needs ${m(CHECKS.minHeadroom)} m clear, so only treads with a top at or below ${m(WALL_HEIGHT - CHECKS.minHeadroom)} m may sit under a slab. The void covers the entire flight, so no tread is under a slab.`,
    '',
    `**Arrival.** Riser 16 lands at z = ${m(topZ)}, stepping north onto the landing at x ${range(STAIR.x)}, z ${range([INTERIOR.min, topZ])}. The whole north edge of the void is the arrival opening; no railing there. The flight is enclosed by the ${rail.side} wall on one side and a full-height partition on the other.`,
    '',
    '### Handrail',
    '',
    table(['Item', 'Value'], [
      ['Wall', `${rail.side} wall, centreline x ${m(box.centre[0])} (${m(rail.wallOffset)} off the face)`],
      ['Section', `${m(rail.section)} × ${m(rail.section)}`],
      ['Extent', `z ${m(rail.zFrom)} to z ${m(rail.zTo)}`],
      ['Height', `centreline ${m(rail.aboveNosing)} above the nosing line: \`y = ${m(STAIR.riser / STAIR.going)} × (${m(STAIR.bottomZ)} − z) + ${m(STAIR.riser + rail.aboveNosing)}\``],
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
    `1. Gross area per level = ${GROSS_AREA.toFixed(2)} m². Net areas match the room tables within ${CHECKS.netAreaTolerance} m².`,
    `2. For every tread *n*, if any slab box overlaps that tread's x–z extent, then \`${m(WALL_HEIGHT)} − ${m(STAIR.riser)}n ≥ ${m(CHECKS.minHeadroom)}\`. With the void over the whole flight this passes vacuously; assert it anyway.`,
    '3. The ground-level stair room and the first-level void coincide, the flight lies within the void, and the landing sits over a single ground-level room (allowing for the partition along its edge).',
    `4. The stair strip is ${m(STAIR.x[1] - STAIR.x[0])} m clear between wall faces on both flanks, and no tread box extends outside it.`,
    `5. No furniture bounding box intersects any wall box. A furniture box may touch a wall face only where its \`Touches\` column says so; elsewhere the minimum gap is ${m(CHECKS.minWallGap)} m.`,
    '6. No furniture bounding box intersects any clear zone.',
    `7. No opaque furniture box intersects the vertical prism of any window opening: the opening span × sill-to-head height × ${m(CHECKS.windowPrismDepth)} m into the room. Transparent elements (glazing, shower screens, the handrail) are exempt.`,
    `8. Every partition is clipped to ${m(INTERIOR.min)} ≤ x, z ≤ ${m(INTERIOR.max)}, so no partition end face is coplanar with a facade.`,
    `9. Visibility. Sample a ${CHECKS.visibilityGrid} × ${CHECKS.visibilityGrid} grid on each target's top face and cast a ray to the default camera in cutaway mode (every wall at ${m(CUTAWAY_WALL_HEIGHT)} m). Occluders are wall, slab and tread boxes only. Assert ${CHECKS.minVisibility} % or more unobstructed. Expected: ${expectedVisibility.join(', ')}.`,
    `10. In front of each wardrobe, WC and shower entry, over the full width, the clear distance to the nearest furniture or wall is at least ${m(CHECKS.minClearance)} m (expected values in the clearance tables).`,
    `11. The handrail centreline is ${m(STAIR.handrail.aboveNosing)} m above every tread nosing, and its underside clears every tread.`,
  ].join('\n');
}

const parts = [
  '# 3D house model — build spec v3',
  '',
  `Two-storey house, ${m(FOOTPRINT)} × ${m(FOOTPRINT)} m per level, ${GROSS_AREA.toFixed(2)} m² gross each. This document is generated from the model's spec data (\`npm run spec-doc\`); it supersedes v2.1.`,
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
    ['Exterior footprint', `${m(FOOTPRINT)} × ${m(FOOTPRINT)} m`],
    ['Gross area per level', `${GROSS_AREA.toFixed(2)} m²`],
    ['Interior envelope', `${m(INTERIOR.max - INTERIOR.min)} × ${m(INTERIOR.max - INTERIOR.min)} m, i.e. x and z from ${m(INTERIOR.min)} to ${m(INTERIOR.max)}`],
    ['Exterior wall thickness', `${m(EXTERIOR_WALL_THICKNESS)} m`],
    ['Interior partition thickness', `${m(PARTITION_THICKNESS)} m`],
    ['Wall height, floor to underside of slab', `${m(WALL_HEIGHT)} m`],
    ['Slab + floor build-up', `${m(SLAB_THICKNESS)} m`],
    ['Floor to floor', `${m(FLOOR_TO_FLOOR)} m`],
    ['Cutaway wall height', `${m(CUTAWAY_WALL_HEIGHT)} m`],
  ]),
  '',
  `Exterior wall centrelines: north z = 0.10, south z = ${m(FOOTPRINT - 0.1)}, west x = 0.10, east x = ${m(FOOTPRINT - 0.1)}. Finished interior faces are at ${m(INTERIOR.min)} and ${m(INTERIOR.max)}. North and south walls run the full footprint; west and east butt against them.`,
  '',
  `**Y convention.** Per level, y = 0 is the finished floor surface. The slab occupies y −${m(SLAB_THICKNESS)} to 0.00. Walls run y 0.00 to ${m(WALL_HEIGHT)}. Both levels are modelled at the same y, side by side.`,
  '',
  `**World placement.** Build each level in local coordinates 0–${FOOTPRINT}, then place the ground group at world (${WORLD_PLACEMENT.ground.join(', ')}) and the first-floor group at (${WORLD_PLACEMENT.first.join(', ')}).`,
  '',
  stairSection(),
  '',
  ...LEVEL_SPECS.map((spec, i) => `${levelSection(spec, 4 + i)}\n`),
  '## Part 6 — Materials',
  '',
  table(['Element', 'Hex'], [
    ['Walls', `\`${COLOURS.wall}\``],
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
