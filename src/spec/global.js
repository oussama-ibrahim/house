// Part 2 of spec v2.1. Every dimension is in metres, per-level coordinates:
// X east, Z south, Y up, origin at the north-west corner of the exterior face,
// y = 0 at the finished floor surface of that level.

export const FOOTPRINT = 6.0;
export const GROSS_AREA = FOOTPRINT * FOOTPRINT;
export const EXTERIOR_WALL_THICKNESS = 0.2;
export const PARTITION_THICKNESS = 0.1;
export const WALL_HEIGHT = 2.6;
export const CUTAWAY_WALL_HEIGHT = 1.2;
export const SLAB_THICKNESS = 0.28;
export const FLOOR_TO_FLOOR = 2.88;
export const INTERIOR = Object.freeze({ min: 0.2, max: 5.8 });

// Visual only: the finish patch stands 10 mm proud of y = 0 so it never z-fights the slab top.
export const FLOOR_FINISH_THICKNESS = 0.01;
export const GLAZING_THICKNESS = 0.02;

// Both levels are modelled at the same y and placed side by side, centred on the world origin.
export const WORLD_PLACEMENT = Object.freeze({
  ground: Object.freeze([-6.75, 0, -3]),
  first: Object.freeze([0.75, 0, -3]),
});

// Seen from the street side (south-east): the front door faces the viewer and the party wall with the
// stair is on the right of the picture.
export const CAMERA = Object.freeze({
  azimuth: 0.86,
  polar: 0.95,
  // `distance` and `target` are the reference view for check 9; the viewer fits the distance and
  // target to whatever is visible so the model fills the frame.
  distance: 21,
  target: Object.freeze([0, 1.1, 0]),
  minDistance: 6,
  maxDistance: 42,
  fov: 45,
});

// Minimum viewport height; the stylesheet lets it grow with the window.
export const VIEWPORT_HEIGHT = 480;

export const LIGHTING = Object.freeze({
  hemisphere: Object.freeze({ sky: '#ffffff', ground: '#9d978c', intensity: 0.8 }),
  directional: Object.freeze({
    colour: '#fff2e0',
    intensity: 0.8,
    position: Object.freeze([10, 16, 8]),
    shadowMapSize: 1024,
    shadowBounds: 14,
  }),
  shadowPlaneY: -0.3,
  // The spec fixes the plane height but not its darkness; 0.3 keeps shadows soft on a transparent background.
  shadowOpacity: 0.3,
});

// Part 6. Fixed scene colours taken from the inspiration photos: white plaster, marble-look tile,
// light oak, beige upholstery, white kitchen, black aluminium frames. Never swap these for theme variables.
export const COLOURS = Object.freeze({
  wall: '#F4F2EE',
  structure: '#C4BFB6',
  wood: '#CBA97D',
  tile: '#D6D3CC',
  marble: '#EDEBE6',
  joinery: '#C49B6C',
  upholstery: '#D9CEBE',
  bedding: '#F2EFE9',
  fittings: '#FAF9F7',
  appliance: '#262626',
  glazing: '#9FC3D8',
  frame: '#1E1E1E',
});
export const GLAZING_OPACITY = 0.35;

// Part 7 thresholds.
export const CHECKS = Object.freeze({
  netAreaTolerance: 0.1,
  roomAreaTolerance: 0.06,
  minHeadroom: 2.05,
  minWallGap: 0.05,
  clearZoneHeight: 2.0,
  windowPrismDepth: 0.35,
  visibilityGrid: 5,
  minVisibility: 60,
  minClearance: 0.6,
});
