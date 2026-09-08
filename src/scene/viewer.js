import {
  Color,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShadowMaterial,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { CAMERA, LIGHTING, VIEWPORT_HEIGHT } from '../spec/global.js';
import { DEFAULT_DESIGN, DESIGN_IDS } from '../spec/designs.js';
import { DEFAULT_LAYOUT, DEFAULT_TOGGLES, DEFAULT_VIEW_MODE, FIT_MARGIN, FIT_MARGIN_X, LAYOUTS, VIEW_MODES } from '../spec/presentation.js';
import { DEFAULT_LANGUAGE, LANGUAGES } from '../i18n/index.js';
import { boxCorners, fitCamera, orbitPosition } from '../model/camera.js';
import { levelSpecs } from '../model/house.js';
import { levelPlacement, roofPosition, roofSize } from '../model/layout.js';
import { roofBounds } from '../model/roof.js';
import { nearExteriorWalls } from '../model/section.js';
import { buildLevelScene, buildRoofGroup, rebuildLayers } from './build.js';
import { createMaterials, disposeMaterials } from './materials.js';

const SHADOW_PLANE_SIZE = 80;
const MAX_PIXEL_RATIO = 2;

function addLights(scene) {
  const { hemisphere, directional } = LIGHTING;
  scene.add(new HemisphereLight(new Color(hemisphere.sky), new Color(hemisphere.ground), hemisphere.intensity));

  const sun = new DirectionalLight(new Color(directional.colour), directional.intensity);
  sun.position.set(...directional.position);
  sun.castShadow = true;
  sun.shadow.mapSize.set(directional.shadowMapSize, directional.shadowMapSize);
  const bounds = directional.shadowBounds;
  Object.assign(sun.shadow.camera, { left: -bounds, right: bounds, top: bounds, bottom: -bounds, near: 1, far: 60 });
  scene.add(sun);
}

function addShadowPlane(scene) {
  const plane = new Mesh(new PlaneGeometry(SHADOW_PLANE_SIZE, SHADOW_PLANE_SIZE), new ShadowMaterial({ opacity: LIGHTING.shadowOpacity }));
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = LIGHTING.shadowPlaneY;
  plane.receiveShadow = true;
  scene.add(plane);
}

function createLabelLayer(container) {
  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.className = 'labels-layer';
  container.appendChild(labelRenderer.domElement);
  return labelRenderer;
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const translated = (points, [dx, dy, dz]) => points.map(([x, y, z]) => [x + dx, y + dy, z + dz]);

/**
 * Owns the renderer, scene, camera and controls for the container. Every design's levels and roof
 * are built once; design, view mode, section cut, layout, roof, text layers and level visibility
 * are visibility and position toggles. The camera fits itself to whatever is visible, at the
 * spec's angles on load and reset and at the user's angles after that.
 */
export function createViewer(container, { language = DEFAULT_LANGUAGE } = {}) {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.domElement.style.touchAction = 'none';
  container.appendChild(renderer.domElement);
  const labelRenderer = createLabelLayer(container);

  const scene = new Scene();
  const camera = new PerspectiveCamera(CAMERA.fov, 1, 0.1, 200);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.minDistance = CAMERA.minDistance;
  controls.maxDistance = CAMERA.maxDistance;

  addLights(scene);
  addShadowPlane(scene);
  const materials = createMaterials();
  const state = { design: DEFAULT_DESIGN, levels: 'both', mode: DEFAULT_VIEW_MODE, layout: DEFAULT_LAYOUT, language, ...DEFAULT_TOGGLES };

  const designs = Object.fromEntries(
    DESIGN_IDS.map((id) => {
      const levels = levelSpecs(id).map((spec) => buildLevelScene(spec, materials, state.language));
      const roof = buildRoofGroup(materials, roofSize(id));
      for (const level of levels) scene.add(level.group);
      scene.add(roof);
      return [id, { id, levels, roof }];
    }),
  );
  const active = () => designs[state.design];
  let frame = 0;

  function requestRender() {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    });
  }

  /** The house as built is only ever shown with its walls whole. */
  const effectiveMode = () => (state.layout === 'assembled' ? 'full' : state.mode);

  function applyWallMode() {
    const mode = effectiveMode();
    const cameraPosition = camera.position.toArray();
    for (const level of active().levels) {
      const near = new Set(mode === 'section' ? nearExteriorWalls(level.spec, level.group.position.toArray(), cameraPosition) : []);
      level.partitions.full.visible = mode === 'full';
      level.partitions.cut.visible = mode !== 'full';
      for (const [id, wall] of Object.entries(level.exterior)) {
        const showCut = mode === 'cutaway' || near.has(id);
        wall.cut.visible = showCut;
        wall.full.visible = !showCut;
      }
      // The rail is fixed to the east wall; it only makes sense while that wall stands at full height.
      if (level.handrail) level.handrail.visible = level.exterior.east.full.visible;
    }
  }

  function applyLayout() {
    const design = active();
    for (const level of design.levels) level.group.position.set(...levelPlacement(state.layout, level.spec.id, design.id));
    design.roof.position.set(...roofPosition(state.layout, design.id));
  }

  function applyVisibility() {
    const assembled = state.layout === 'assembled';
    for (const design of Object.values(designs)) {
      const current = design.id === state.design;
      for (const level of design.levels) {
        level.group.visible = current && (state.levels === 'both' || state.levels === level.spec.id);
        // Interior text has no place on the house seen from outside.
        level.layers.labels.visible = state.labels && !assembled;
        level.layers.dimensions.visible = state.dimensions && !assembled;
      }
      // The lifted roof belongs to the exploded view of the whole house, and the assembled house
      // always wears it; over a single exploded level it only hides rooms.
      design.roof.visible = current && (assembled ? state.levels === 'both' || state.levels === 'first' : state.roof && state.levels === 'both');
    }
    labelRenderer.domElement.hidden = !(state.labels || state.dimensions) || assembled;
  }

  function visiblePoints() {
    const design = active();
    const points = [];
    for (const level of design.levels) {
      if (!level.group.visible) continue;
      const offset = level.group.position.toArray();
      points.push(...translated(level.fitPoints.built, offset));
      if (level.layers.labels.visible || level.layers.dimensions.visible) points.push(...translated(level.fitPoints.annotations, offset));
    }
    if (design.roof.visible) points.push(...boxCorners(roofBounds(design.roof.position.toArray(), roofSize(design.id))));
    return points;
  }

  /** Aim at the centre of the visible picture and back off just far enough to frame all of it. */
  function fitView(angles) {
    const fit = fitCamera(angles, visiblePoints(), { fov: CAMERA.fov, aspect: camera.aspect, margin: FIT_MARGIN, marginX: FIT_MARGIN_X });
    const distance = clamp(fit.distance, CAMERA.minDistance, CAMERA.maxDistance);
    camera.position.set(...orbitPosition({ ...angles, target: fit.target, distance }));
    controls.target.set(...fit.target);
    controls.update();
    applyWallMode();
    requestRender();
  }

  const currentAngles = () => ({ azimuth: controls.getAzimuthalAngle(), polar: controls.getPolarAngle() });

  function refit() {
    applyVisibility();
    fitView(currentAngles());
  }

  function resetView() {
    applyVisibility();
    fitView({ azimuth: CAMERA.azimuth, polar: CAMERA.polar });
  }

  function resize() {
    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, VIEWPORT_HEIGHT);
    renderer.setSize(width, height);
    labelRenderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    requestRender();
  }

  controls.addEventListener('change', () => {
    if (effectiveMode() === 'section') applyWallMode();
    requestRender();
  });
  const observer = new ResizeObserver(() => {
    resize();
    fitView(currentAngles());
  });
  observer.observe(container);
  window.addEventListener('resize', resize);

  resize();
  applyLayout();
  resetView();

  return {
    setDesign(id) {
      if (!DESIGN_IDS.includes(id)) throw new Error(`Unknown design "${id}"`);
      state.design = id;
      applyLayout();
      refit();
    },
    setLevels(mode) {
      state.levels = mode;
      refit();
    },
    setMode(mode) {
      if (!VIEW_MODES.includes(mode)) throw new Error(`Unknown view mode "${mode}"`);
      state.mode = mode;
      applyWallMode();
      requestRender();
    },
    setLayout(layout) {
      if (!LAYOUTS.includes(layout)) throw new Error(`Unknown layout "${layout}"`);
      state.layout = layout;
      applyLayout();
      refit();
    },
    setRoof(on) {
      state.roof = on;
      refit();
    },
    setLabels(on) {
      state.labels = on;
      refit();
    },
    setDimensions(on) {
      state.dimensions = on;
      refit();
    },
    setLanguage(next) {
      if (!LANGUAGES.includes(next)) throw new Error(`Unknown language "${next}"`);
      state.language = next;
      for (const design of Object.values(designs)) for (const level of design.levels) rebuildLayers(level, materials, next);
      applyVisibility();
      requestRender();
    },
    resetView,
    /** Refits the view at the given angles; either angle falls back to the spec's default. */
    setAngles({ azimuth = CAMERA.azimuth, polar = CAMERA.polar } = {}) {
      applyVisibility();
      fitView({ azimuth, polar });
    },
    getState: () => ({ ...state }),
    dispose() {
      observer.disconnect();
      window.removeEventListener('resize', resize);
      controls.dispose();
      disposeMaterials(materials);
      renderer.dispose();
      renderer.domElement.remove();
      labelRenderer.domElement.remove();
    },
  };
}
