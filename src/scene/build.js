import { BoxGeometry, EdgesGeometry, Group, LineSegments, Mesh } from 'three';
import { CUTAWAY_WALL_HEIGHT, WALL_HEIGHT } from '../spec/global.js';
import { annotationPoints } from '../model/annotations.js';
import { centre, size } from '../model/box.js';
import { boxCorners } from '../model/camera.js';
import { buildLevel, levelBounds } from '../model/level.js';
import { roofBoxes } from '../model/roof.js';
import { BOX_FACES, outwardNormal } from '../model/walls.js';
import { buildDimensionLayer, buildLabelLayer, disposeLayer } from './labels.js';

// Every element is the same unit cube, scaled and positioned; its outline is the unit cube's
// edge set as a child, so it inherits the scale and costs no geometry of its own.
const UNIT_BOX = new BoxGeometry(1, 1, 1);
const UNIT_EDGES = new EdgesGeometry(UNIT_BOX);

function decorate(mesh, materials, { castShadow, outline, name }) {
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  mesh.name = name;
  if (outline) mesh.add(new LineSegments(UNIT_EDGES, materials.outline));
  return mesh;
}

function materialOf(materials, key, box) {
  const material = materials[key];
  if (!material) throw new Error(`No material "${key}" for ${box.id}`);
  return material;
}

/** One material, or one per face when the box carries a facade finish on some faces. */
function surfaceOf(box, materials) {
  if (!box.faces) return materialOf(materials, box.material, box);
  return BOX_FACES.map((face) => materialOf(materials, box.faces[face] ?? box.material, box));
}

function meshForBox(box, materials, { castShadow = true, outline = true } = {}) {
  const mesh = new Mesh(UNIT_BOX, surfaceOf(box, materials));
  mesh.scale.set(...size(box));
  mesh.position.set(...centre(box));
  return decorate(mesh, materials, { castShadow, outline, name: box.id });
}

function meshForRotatedBox(item, materials, { castShadow = true } = {}) {
  const mesh = new Mesh(UNIT_BOX, materials[item.material]);
  mesh.scale.set(...item.size);
  mesh.position.set(...item.centre);
  mesh.rotation.x = item.rotationX ?? 0;
  mesh.rotation.z = item.rotationZ ?? 0;
  return decorate(mesh, materials, { castShadow, outline: true, name: item.id });
}

function groupOf(name, boxes, materials, options) {
  const group = new Group();
  group.name = name;
  for (const box of boxes) group.add(meshForBox(box, materials, options));
  return group;
}

function furnitureGroup(name, entries, materials) {
  const group = new Group();
  group.name = name;
  for (const { piece, boxes } of entries) {
    for (const box of boxes) group.add(meshForBox(box, materials, { castShadow: !piece.transparent, outline: !piece.transparent }));
  }
  return group;
}

/** The lifted roof for a top level of the given size, centred on its own origin; the viewer places it. */
export function buildRoofGroup(materials, size) {
  const group = new Group();
  group.name = 'roof';
  // A lifted roof must not shade the rooms it floats near.
  for (const part of roofBoxes(size)) group.add(meshForBox(part, materials, { castShadow: false }));
  return group;
}

/** Swaps the level's text layers for ones in the given language. */
export function rebuildLayers(levelScene, materials, language) {
  for (const layer of Object.values(levelScene.layers)) disposeLayer(layer);
  const labels = buildLabelLayer(levelScene.spec, materials, language);
  const dimensions = buildDimensionLayer(levelScene.model, materials, language);
  levelScene.group.add(labels, dimensions);
  levelScene.layers = { labels, dimensions };
}

/**
 * Everything the viewer needs for one level, built once. Walls come in two heights so the view
 * mode and the section cut are pure visibility toggles: `exterior[id].full` / `.cut`, and
 * `partitions.full` / `.cut`. The group is placed by the viewer, so fit points stay level-local.
 */
export function buildLevelScene(spec, materials, language) {
  const full = buildLevel(spec, { wallHeight: WALL_HEIGHT });
  const cut = buildLevel(spec, { wallHeight: CUTAWAY_WALL_HEIGHT });

  const group = new Group();
  group.name = spec.id;

  group.add(groupOf('structure', [...full.slabs, ...full.treads], materials));
  group.add(groupOf('floors', full.floors, materials, { castShadow: false, outline: false }));
  group.add(furnitureGroup('furniture', full.furniture, materials));
  group.add(furnitureGroup('dressing', full.dressing, materials));

  const exterior = {};
  const partitions = { full: new Group(), cut: new Group() };
  partitions.full.name = 'partitions:full';
  partitions.cut.name = 'partitions:cut';
  // Glazing and frames belong to the full-height variant only; a cut wall shows plain reveals.
  const addOpenings = (target, entry) => {
    for (const pane of entry.glazing) target.add(meshForBox(pane, materials, { castShadow: false, outline: false }));
    for (const member of entry.frames) target.add(meshForBox(member, materials, { outline: false }));
  };
  full.walls.forEach((entry, i) => {
    const cutEntry = cut.walls[i];
    if (entry.wall.exterior) {
      const fullGroup = groupOf(`${entry.wall.id}:full`, entry.solids, materials);
      addOpenings(fullGroup, entry);
      const cutGroup = groupOf(`${entry.wall.id}:cut`, cutEntry.solids, materials);
      exterior[entry.wall.id] = { normal: outwardNormal(entry.wall), full: fullGroup, cut: cutGroup };
      group.add(fullGroup, cutGroup);
      return;
    }
    for (const box of entry.solids) partitions.full.add(meshForBox(box, materials));
    addOpenings(partitions.full, entry);
    for (const box of cutEntry.solids) partitions.cut.add(meshForBox(box, materials));
  });
  group.add(partitions.full, partitions.cut);

  const handrail = full.handrail ? meshForRotatedBox(full.handrail, materials) : null;
  if (handrail) group.add(handrail);
  for (const item of full.stairwork.sloped) group.add(meshForRotatedBox(item, materials));
  group.add(groupOf('stairwork', full.stairwork.boxes, materials, { outline: false }));

  const levelScene = {
    spec,
    model: full,
    group,
    exterior,
    partitions,
    handrail,
    layers: {},
    // Level-local points the camera must keep in frame: the built volume's corners, plus the
    // annotations when their layers are showing.
    fitPoints: { built: boxCorners(levelBounds(full)), annotations: annotationPoints(spec) },
  };
  rebuildLayers(levelScene, materials, language);
  return levelScene;
}
