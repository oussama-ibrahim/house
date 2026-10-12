// The French the contractor's drawings are written in, keyed by the spec's ids. Kept apart from the
// viewer's English/Arabic interface strings: these are drawing terms, not interface text.

export const ROOM_NAMES = Object.freeze({
  wc: 'WC + buanderie',
  kitchen: 'Cuisine',
  living: 'Séjour / salle à manger',
  stair: 'Escalier',
  landing: 'Palier',
  shower: "Salle d'eau",
  void: 'Vide sur escalier',
  bedroom1: 'Chambre 1 (parentale)',
  bedroom2: 'Chambre 2',
});

export const FINISHES = Object.freeze({
  marble: 'Sol marbre',
  tile: 'Sol carrelage',
  wood: 'Sol parquet',
});

// Pieces worth naming on the plan: built-ins, appliances and the fittings that fix the plumbing.
export const PIECE_NAMES = Object.freeze({
  dressing1: 'Dressing intégré',
  dressing2: 'Dressing intégré',
  hallUnit: 'Niche',
  tallCabinet: 'Colonne',
  fridge: 'Frigo',
  northRun: 'Plan de travail',
  sink: 'Évier',
  hob: 'Plaque',
  washingMachine: 'LL',
  basin: 'Lavabo',
  wc: 'WC',
  wc1: 'WC',
  basin1: 'Lavabo',
  showerTray1: 'Douche',
  shelves: 'Étagères',
  linen: 'Placard',
  tvUnit: 'Meuble TV',
});

// Fixed joinery and fittings are drawn firmer than loose furniture; wall cabinets hang above the cut.
export const BUILT_IN = Object.freeze(new Set([
  'dressing1', 'dressing2', 'hallUnit', 'tallCabinet', 'fridge', 'northRun', 'eastRun', 'washingMachine',
  'basin', 'wc', 'wc1', 'basin1', 'showerTray1', 'screenE1', 'screenS1', 'shelves', 'linen',
]));
export const ABOVE_CUT = Object.freeze(new Set(['wallCabinets']));
// Visual pieces still worth placing on a plan: the kitchen's wet and hot points.
export const DRAWN_DRESSING = Object.freeze(new Set(['sink', 'hob']));
// Street-front pieces whose footprint reads on a plan.
export const FACADE_OUTLINES = Object.freeze({ ground: ['step', 'planters', 'westPlanter'], first: ['frame', 'pier'] });

export const OPENING_KINDS = Object.freeze({
  window: 'Fenêtre',
  highWindow: 'Fenêtre haute',
  fixed: 'Châssis fixe',
  door: 'Porte',
  entrance: "Porte d'entrée",
  slidingDoor: 'Porte coulissante vitrée',
});

export const SHEET_TITLES = Object.freeze({
  ground: 'Plan du rez-de-chaussée',
  first: "Plan de l'étage",
});

export const PROJECT = 'Maison R+1 — terrain 6,15 × 7,20 m';
export const STATUS = 'Avant-projet — plan de principe, non destiné à l’exécution';
