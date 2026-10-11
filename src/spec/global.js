// Part 2 of spec v2.1. Every dimension is in metres, per-level coordinates:
// X east, Z south, Y up, origin at the north-west corner of the exterior face,
// y = 0 at the finished floor surface of that level.

// The plot: 6.15 m along the street (east–west) by 7.20 m deep (north–south). The first level
// projects 1.00 m over the street beyond the ground level's south face on a cantilevered slab, so it
// is 8.20 m deep; both levels keep their origin at the shared north-west corner.
export const FOOTPRINT = Object.freeze({ width: 6.15, depth: 7.2 });
export const UPPER_FOOTPRINT = Object.freeze({ width: 6.15, depth: 8.2 });
export const GROSS_AREA = FOOTPRINT.width * FOOTPRINT.depth;
export const EXTERIOR_WALL_THICKNESS = 0.2;
export const PARTITION_THICKNESS = 0.1;
export const WALL_HEIGHT = 2.6;
export const CUTAWAY_WALL_HEIGHT = 1.2;
export const SLAB_THICKNESS = 0.28;
export const FLOOR_TO_FLOOR = 2.88;
// Finished interior faces of each footprint, written out so spec coordinates match them exactly.
export const INTERIOR = Object.freeze({ min: 0.2, xMax: 5.95, zMax: 7.0 });
export const UPPER_INTERIOR = Object.freeze({ min: 0.2, xMax: 5.95, zMax: 8.0 });

// The one interior column, 0.25 × 0.25, foundation to roof, a site fact the user gave as 2.95 m
// from the party wall's outer face and 4.20 m from the street front's outer face, both to its near
// edge. Both levels share the north-west origin, so it has the same x–z on each.
export const COLUMN = Object.freeze({ id: 'C1', x: Object.freeze([2.95, 3.2]), z: Object.freeze([2.75, 3.0]) });

// The window family. Every window is one of these types; the sill sits just above what stands
// beneath the type, and all but the stair slot share a 2.40 head (a 0.20 m lintel under the slab).
// Positions are the only thing a level chooses.
export const WINDOW_TYPES = Object.freeze({
  // Habitable rooms: sofa and bed height beneath. 1.80 wide, the user's call for more light.
  room: Object.freeze({ width: 1.8, sill: 0.9, head: 2.4 }),
  // Wet rooms and the landing: privacy and fittings beneath.
  high: Object.freeze({ width: 0.8, sill: 1.2, head: 2.4 }),
  // Over the kitchen worktop.
  kitchen: Object.freeze({ width: 2.1, sill: 1.1, head: 2.4 }),
  // Bedroom 1's street front, floor to head: the pane below the transom is fixed laminated glass and
  // is the guard, so no railing is needed over the street.
  picture: Object.freeze({ width: 3.0, sill: 0, head: 2.4, transom: 0.9 }),
  // The stair slot, one narrow fixed pane per level, wall top to wall top so the two read as one
  // vertical strip broken only by the slab edge. The lower one stands over the landing (top 0.72),
  // so it is fixed laminated glass; the upper one rises from the void.
  slotLower: Object.freeze({ width: 0.45, sill: 0.9, head: 2.6 }),
  slotUpper: Object.freeze({ width: 0.45, sill: 0, head: 2.6 }),
});

// Visual only: the finish patch stands 10 mm proud of y = 0 so it never z-fights the slab top.
export const FLOOR_FINISH_THICKNESS = 0.01;
export const GLAZING_THICKNESS = 0.02;

// Both levels are modelled at the same y and placed side by side with a 1.5 m gap, the pair centred
// on the world origin.
export const WORLD_PLACEMENT = Object.freeze({
  ground: Object.freeze([-6.9, 0, -3.6]),
  first: Object.freeze([0.75, 0, -4.1]),
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
  // Wood-look cladding on the first level's outer faces, a shade deeper than the oak joinery so the
  // overhanging box reads as one deliberate volume over the white ground floor.
  cladding: '#A47A52',
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
