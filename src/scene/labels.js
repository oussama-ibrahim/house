import { BufferGeometry, Group, Line, Mesh, SphereGeometry, Vector3 } from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { metres, t } from '../i18n/index.js';
import { dimensionLines, levelCaption, roomDimensions, roomLabels } from '../model/annotations.js';

const MARKER = new SphereGeometry(0.045, 12, 8);

function line(points, material) {
  return new Line(new BufferGeometry().setFromPoints(points.map((p) => new Vector3(...p))), material);
}

function textElement(className, lines) {
  const root = document.createElement('div');
  root.className = className;
  for (const [cls, text] of lines) {
    const span = document.createElement('span');
    span.className = cls;
    span.textContent = text;
    root.appendChild(span);
  }
  return root;
}

function labelObject(element, position) {
  const object = new CSS2DObject(element);
  object.position.set(...position);
  return object;
}

/** Pinned room labels and the level caption, in level-local coordinates and the given language. */
export function buildLabelLayer(spec, materials, language) {
  const group = new Group();
  group.name = `${spec.id}:labels`;

  for (const pin of roomLabels(spec)) {
    group.add(line([pin.anchor, pin.point], materials.leader));
    const marker = new Mesh(MARKER, materials.marker);
    marker.position.set(...pin.anchor);
    group.add(marker);
    group.add(labelObject(textElement('pin', [['pin__text', t(pin.text, language)]]), pin.point));
  }

  const caption = levelCaption(spec);
  const areas = `${caption.gross.toFixed(0)} ${t('m²', language)} ${t('gross', language)} · ${caption.net.toFixed(1)} ${t('m²', language)} ${t('net', language)}`;
  group.add(labelObject(textElement('caption', [['caption__title', t(caption.title, language)], ['caption__sub', areas]]), caption.position));

  return group;
}

/** Edge dimension lines and a size tag in every finished room: name, width × depth, net area. */
export function buildDimensionLayer(level, materials, language) {
  const group = new Group();
  group.name = `${level.spec.id}:dimensions`;

  for (const dimension of dimensionLines(level.spec)) {
    group.add(line([dimension.from, dimension.to], materials.leader));
    for (const tick of dimension.ticks) group.add(line(tick, materials.leader));
    group.add(labelObject(textElement('dim', [['dim__text', metres(6, language)]]), dimension.middle));
  }

  for (const room of roomDimensions(level.spec)) {
    const size = `${room.size[0].toFixed(2)} × ${room.size[1].toFixed(2)} ${t('m', language)} · ${room.area.toFixed(1)} ${t('m²', language)}`;
    group.add(labelObject(textElement('tag', [['tag__name', t(room.name, language)], ['tag__size', size]]), room.position));
  }

  return group;
}

/** Removes a layer from its parent and its DOM elements from the page. */
export function disposeLayer(layer) {
  layer.traverse((object) => {
    if (object.isCSS2DObject) object.element.remove();
  });
  layer.removeFromParent();
}
