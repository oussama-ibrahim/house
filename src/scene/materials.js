import { Color, DoubleSide, LineBasicMaterial, MeshBasicMaterial, MeshLambertMaterial } from 'three';
import { COLOURS, GLAZING_OPACITY } from '../spec/global.js';
import { OUTLINE, PRESENTATION_COLOURS } from '../spec/presentation.js';

/**
 * One shared MeshLambertMaterial per colour. Opaque faces are pushed back a hair so the drawn
 * outlines sit cleanly on top of them; glazing is the only translucent surface.
 */
export function createMaterials() {
  const materials = {};
  for (const [key, hex] of Object.entries({ ...COLOURS, ...PRESENTATION_COLOURS })) {
    materials[key] = new MeshLambertMaterial({
      color: new Color(hex),
      name: key,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
  }
  materials.glazing.transparent = true;
  materials.glazing.opacity = GLAZING_OPACITY;
  materials.glazing.depthWrite = false;
  materials.glazing.side = DoubleSide;
  materials.glazing.polygonOffset = false;

  materials.outline = new LineBasicMaterial({ color: new Color(OUTLINE.colour), transparent: true, opacity: OUTLINE.opacity });
  materials.leader = new LineBasicMaterial({ color: new Color(PRESENTATION_COLOURS.ink) });
  materials.marker = new MeshBasicMaterial({ color: new Color(PRESENTATION_COLOURS.ink) });
  return materials;
}

export function disposeMaterials(materials) {
  for (const material of Object.values(materials)) material.dispose();
}
