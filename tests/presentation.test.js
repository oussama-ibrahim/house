// The illustration layer: section cut, roof, dressing and labels. None of it may disturb the spec geometry.
import { describe, expect, it } from 'vitest';
import { CAMERA, CHECKS, CUTAWAY_WALL_HEIGHT, WALL_HEIGHT, WINDOW_TYPES, WORLD_PLACEMENT } from '../src/spec/global.js';
import { ROOF } from '../src/spec/presentation.js';
import { STAIR } from '../src/spec/stair.js';
import { dimensionLines, levelCaption, roomLabels } from '../src/model/annotations.js';
import { intersects } from '../src/model/box.js';
import { orbitPosition } from '../src/model/camera.js';
import { buildHouse } from '../src/model/house.js';
import { furnitureBoxList } from '../src/model/level.js';
import { roofBoxes, roofHeights } from '../src/model/roof.js';
import { starterFootX } from '../src/model/stair.js';
import { nearExteriorWalls } from '../src/model/section.js';
import { openingPrism } from '../src/model/walls.js';

const house = buildHouse({ cutaway: false });

describe('section cut', () => {
  it('lowers the south and east walls for the default south-east camera on both levels', () => {
    const camera = orbitPosition(CAMERA);
    for (const { spec } of house.levels) {
      expect(nearExteriorWalls(spec, WORLD_PLACEMENT[spec.id], camera).sort()).toEqual(['east', 'south']);
    }
  });

  it('flips to the north and west walls when the camera orbits half a turn', () => {
    const camera = orbitPosition({ ...CAMERA, azimuth: CAMERA.azimuth + Math.PI });
    expect(nearExteriorWalls(house.levels[0].spec, WORLD_PLACEMENT.ground, camera).sort()).toEqual(['north', 'west']);
  });
});

describe('roof', () => {
  it('floats clear of the wall tops with the parapet on the slab', () => {
    const { slabBottom, slabTop, parapetTop } = roofHeights();
    expect(slabBottom).toBeCloseTo(WALL_HEIGHT + ROOF.lift, 9);
    expect(slabTop - slabBottom).toBeCloseTo(ROOF.slabThickness, 9);
    expect(parapetTop - slabTop).toBeCloseTo(ROOF.parapetHeight, 9);
  });

  it('is a 6.15 × 7.20 slab with four parapets and a membrane inside them, centred on its origin', () => {
    const boxes = roofBoxes();
    const slab = boxes.find((b) => b.id === 'roof:slab');
    expect([slab.min[0], slab.max[0], slab.min[2], slab.max[2]]).toEqual([-3.075, 3.075, -3.6, 3.6]);
    const parapets = boxes.filter((b) => b.id.startsWith('roof:parapet:'));
    expect(parapets).toHaveLength(4);
    for (const parapet of parapets) expect(parapet.max[1] - parapet.min[1]).toBeCloseTo(ROOF.parapetHeight, 9);
    const membrane = boxes.find((b) => b.id === 'roof:membrane');
    expect(membrane.min[0]).toBeCloseTo(-3.075 + ROOF.parapetThickness, 9);
    for (const parapet of parapets) expect(intersects(membrane, parapet)).toBe(false);
  });
});

describe('windows', () => {
  it('draws every window from the family', () => {
    for (const { spec } of house.levels) {
      for (const wall of spec.walls) {
        for (const opening of wall.openings.filter((o) => o.kind === 'window' && !o.open && o.head < WALL_HEIGHT)) {
          const type = WINDOW_TYPES[opening.type];
          expect(type, `${spec.name}: ${opening.id} has no type`).toBeTruthy();
          expect(opening.to - opening.from).toBeCloseTo(type.width, 9);
          expect([opening.sill, opening.head]).toEqual([type.sill, type.head]);
        }
      }
    }
  });

  it.each([
    ['west', 'Win3', 'Win8'],
    ['west', 'Win4', 'Win14'],
    ['south', 'Win6', 'Win15'],
  ])('stacks the %s windows %s and %s on one axis', (wallId, lowerId, upperId) => {
    const [ground, first] = house.levels.map((level) => level.spec);
    const opening = (spec, id) => spec.walls.find((w) => w.id === wallId).openings.find((o) => o.id === id);
    const axis = (o) => (o.from + o.to) / 2;
    expect(axis(opening(ground, lowerId))).toBeCloseTo(axis(opening(first, upperId)), 9);
  });

  it('opens the front door at the stair foot, under the overhang', () => {
    const [ground, first] = house.levels.map((level) => level.spec);
    const doorway = ground.walls.find((w) => w.id === 'south').openings.find((o) => o.id === 'D1');
    const stairFoot = ground.clearZones.find((zone) => zone.opening === 'stairFoot');
    expect(doorway.from).toBeGreaterThanOrEqual(stairFoot.x[0]);
    expect(doorway.to).toBeLessThanOrEqual(starterFootX(STAIR));
    expect(first.size[1]).toBeGreaterThan(ground.size[1]);
  });

  it('keeps every front window clear of the starter leg, so no step climbs beside a low sill', () => {
    const [ground] = house.levels.map((level) => level.spec);
    const leg = [starterFootX(STAIR), STAIR.x[0]];
    for (const opening of ground.walls.find((w) => w.id === 'south').openings) {
      const overlap = Math.min(opening.to, leg[1]) - Math.max(opening.from, leg[0]);
      expect(overlap, opening.id).toBeLessThanOrEqual(0);
    }
  });

  it('runs the stair slot from wall top to wall top so its two panes read as one strip', () => {
    const [ground, first] = house.levels.map((level) => level.spec);
    const lower = ground.walls.find((w) => w.id === 'south').openings.find((o) => o.id === 'Win6');
    const upper = first.walls.find((w) => w.id === 'south').openings.find((o) => o.id === 'Win15');
    expect([lower.head, upper.head, upper.sill]).toEqual([WALL_HEIGHT, WALL_HEIGHT, 0]);
    expect([lower.from, lower.to]).toEqual([upper.from, upper.to]);
  });

  it('guards the floor-to-head picture window with a transom over fixed glass', () => {
    const [, first] = house.levels.map((level) => level.spec);
    const picture = first.walls.find((w) => w.id === 'south').openings.find((o) => o.id === 'Win11');
    expect([picture.sill, picture.transom]).toEqual([0, WINDOW_TYPES.picture.transom]);
    const frames = house.levels[1].model.walls.find((entry) => entry.wall.id === 'south').frames;
    expect(frames.some((f) => f.id === 'south:Win11:transom')).toBe(true);
  });
});

describe('dressing', () => {
  it.each(house.levels.map((level) => [level.spec.name, level]))('%s dressing sits on things, never inside them', (_, level) => {
    const solids = [...furnitureBoxList(level.model), ...level.model.walls.map((entry) => entry.envelope), ...level.model.treads];
    for (const { piece, boxes } of level.model.dressing) {
      for (const box of boxes) {
        for (const solid of solids) expect(intersects(box, solid), `${piece.name} intersects ${solid.id}`).toBe(false);
      }
    }
  });

  it.each(house.levels.map((level) => [level.spec.name, level]))('%s opaque dressing stays out of window prisms', (_, level) => {
    for (const { wall } of level.model.walls) {
      for (const opening of wall.openings.filter((o) => o.kind === 'window')) {
        const prism = openingPrism(wall, opening, CHECKS.windowPrismDepth);
        for (const { piece, boxes } of level.model.dressing) {
          if (piece.transparent) continue;
          for (const box of boxes) expect(intersects(box, prism), `${piece.name} in ${opening.id}`).toBe(false);
        }
      }
    }
  });
});

describe('annotations', () => {
  it('pins every room that has a finish, plus the void, on each level', () => {
    for (const { spec } of house.levels) {
      const pinned = roomLabels(spec).map((pin) => pin.id);
      for (const room of spec.rooms) expect(pinned, `${spec.name}: ${room.id}`).toContain(room.id);
      // Pins are DOM elements and always draw on top; the leader only needs to clear the cut walls.
      for (const pin of roomLabels(spec)) expect(pin.point[1]).toBeGreaterThan(CUTAWAY_WALL_HEIGHT);
    }
  });

  it('captions each level with gross and net area and measures the outer edges', () => {
    const [ground, first] = house.levels.map((level) => level.spec);
    expect(levelCaption(ground).gross).toBeCloseTo(44.28, 9);
    expect(levelCaption(ground).net).toBe(37.7);
    expect(levelCaption(ground).position[0]).toBeLessThan(0);
    expect(levelCaption(first).position[0]).toBeGreaterThan(6.15);

    // Dimensions sit on edges nearest the south-east camera, where nothing hides the lines. The
    // ground level measures only its south edge: its east edge faces the gap full of the first level's pins.
    const groundDims = dimensionLines(ground);
    expect(groundDims.map((d) => [d.id, d.length])).toEqual([['south', 6.15]]);
    expect(groundDims[0].from[2]).toBeGreaterThan(7.2);
    const firstDims = dimensionLines(first);
    expect(firstDims.map((d) => d.id)).toEqual(['south', 'east']);
    expect(firstDims[1].from[0]).toBeGreaterThan(6.15);
  });
});
