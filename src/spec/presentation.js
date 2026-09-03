// Illustration layer on top of the build spec: section cut, outlines, labels, dimensions, roof.
// Nothing here changes the geometry the acceptance checks measure.

export const VIEW_MODES = Object.freeze(['section', 'cutaway', 'full']);
export const DEFAULT_VIEW_MODE = 'section';

// 'exploded' sets the levels side by side with the roof lifted off; 'assembled' stacks them into the
// house as built, roof seated, walls always full height.
export const LAYOUTS = Object.freeze(['exploded', 'assembled']);
export const DEFAULT_LAYOUT = 'exploded';

// The three overlays start switched off; the model reads cleanest bare.
export const DEFAULT_TOGGLES = Object.freeze({ roof: false, labels: false, dimensions: false });

// Assembled layout: the ground level's footprint sits centred on the world origin.
export const ASSEMBLED_ORIGIN = Object.freeze([-3, 0, -3]);

// Fraction of the frame the visible levels (and roof) are fitted into on load, reset and level
// toggles. The horizontal margin is looser because label boxes spread sideways from their pins.
export const FIT_MARGIN = 0.92;
export const FIT_MARGIN_X = 0.8;

export const PRESENTATION_COLOURS = Object.freeze({
  slate: '#5F6368',
  ink: '#2B2A27',
});

export const OUTLINE = Object.freeze({ colour: '#3A3833', opacity: 0.35 });

// Black aluminium frames in every window opening: jambs, rails and a mullion per ~0.8 m pane.
export const FRAME = Object.freeze({ member: 0.05, depth: 0.06, paneWidth: 0.8 });

// A flat roof: the 6 × 6 slab with a parapet all round and a membrane inside it.
export const ROOF = Object.freeze({
  slabThickness: 0.28,
  parapetHeight: 1.1,
  parapetThickness: 0.2,
  membraneThickness: 0.02,
  // Lifted off above the far corner of the first level, the way an exploded drawing shows a removed
  // roof. Shifted north-east, away from the camera and away from the ground level beside it, and
  // lifted 2.5 m, it never sits between the camera and either interior and fills frame that would
  // otherwise be empty.
  anchorLevel: 'first',
  lift: 2.5,
  shift: Object.freeze([1.6, -1.6]),
});

export const LABELS = Object.freeze({
  anchorHeight: 0.02,
  leaderHeight: 2.4,
  captionHeight: 0.05,
});

export const DIMENSIONS = Object.freeze({ offset: 0.7, tick: 0.2, lineHeight: 0.02 });
