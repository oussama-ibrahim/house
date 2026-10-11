// What stands round the house and shows with it. East of the party wall is the parents' garage:
// a standard single-car bay as deep as the plot, open to the street with no door, its render and
// street face dressed like the house's front. Its roof is the ground level's ceiling slab carried on
// east, and runs forward to the overhang's front line so the two read as one band across the
// street. A 1.00 m parapet runs round its three open sides; the fourth butts against the house. It
// is context: drawn only with the assembled house, never part of a level's plan, measured or
// checked. Coordinates are the ground level's.
import { FRONT_LINE, garageFront } from './facades.js';
import { FLOOR_TO_FLOOR, FOOTPRINT, SLAB_THICKNESS, WALL_HEIGHT } from './global.js';
import { block, piece } from './helpers.js';

const GARAGE = Object.freeze({ x: Object.freeze([FOOTPRINT.width, FOOTPRINT.width + 3.0]), z: Object.freeze([0, FOOTPRINT.depth]) });
const GARAGE_WALL = 0.2;
const ROOF_Y = Object.freeze([WALL_HEIGHT, FLOOR_TO_FLOOR]);
// The open bay's head; the lintel above it fills the street face up to the roof slab.
const BAY_HEAD = 2.4;

const PARAPET_HEIGHT = 1.0;

const roofUnderside = ROOF_Y[0];
const innerEast = GARAGE.x[1] - GARAGE_WALL;
const roofZ = [GARAGE.z[0], FRONT_LINE];
const parapetY = [ROOF_Y[1], ROOF_Y[1] + PARAPET_HEIGHT];

export const PARENTS_GARAGE = Object.freeze([
  piece('garage', "Parents' garage", 'beige', [
    block(GARAGE.x, ROOF_Y, roofZ),
    block([innerEast, GARAGE.x[1]], [0, roofUnderside], GARAGE.z),
    block([GARAGE.x[0], innerEast], [0, roofUnderside], [GARAGE.z[0], GARAGE.z[0] + GARAGE_WALL]),
    block([GARAGE.x[0], innerEast], [BAY_HEAD, roofUnderside], [GARAGE.z[1] - GARAGE_WALL, GARAGE.z[1]]),
  ]),
  // North and south run the full width; the east side butts between them.
  piece('garageParapet', "Parapet round the garage roof", 'beige', [
    block(GARAGE.x, parapetY, [roofZ[0], roofZ[0] + GARAGE_WALL]),
    block(GARAGE.x, parapetY, [roofZ[1] - GARAGE_WALL, roofZ[1]]),
    block([innerEast, GARAGE.x[1]], parapetY, [roofZ[0] + GARAGE_WALL, roofZ[1] - GARAGE_WALL]),
  ]),
  piece('garageFloor', "Parents' garage floor", 'structure', [block([GARAGE.x[0], innerEast], [-SLAB_THICKNESS, 0], [GARAGE.z[0] + GARAGE_WALL, GARAGE.z[1]])]),
  ...garageFront({ x: GARAGE.x, bay: { from: GARAGE.x[0], to: innerEast, sill: 0, head: BAY_HEAD } }),
]);
