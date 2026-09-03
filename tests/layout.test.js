import { describe, expect, it } from 'vitest';
import { FLOOR_TO_FLOOR, WALL_HEIGHT, WORLD_PLACEMENT } from '../src/spec/global.js';
import { ROOF } from '../src/spec/presentation.js';
import { buildHouse } from '../src/model/house.js';
import { levelPlacement, roofPosition } from '../src/model/layout.js';
import { roomDimensions } from '../src/model/annotations.js';
import { roofHeights } from '../src/model/roof.js';

describe('layouts', () => {
  it('keeps the exploded placement from the spec', () => {
    expect(levelPlacement('exploded', 'ground')).toEqual([...WORLD_PLACEMENT.ground]);
    expect(levelPlacement('exploded', 'first')).toEqual([...WORLD_PLACEMENT.first]);
  });

  it('stacks the assembled house one floor-to-floor height per storey and seats the roof on the top walls', () => {
    const ground = levelPlacement('assembled', 'ground');
    const first = levelPlacement('assembled', 'first');
    expect(first[1] - ground[1]).toBeCloseTo(FLOOR_TO_FLOOR, 9);
    expect([first[0], first[2]]).toEqual([ground[0], ground[2]]);
    const roof = roofPosition('assembled');
    expect(roof[1] + roofHeights().slabBottom).toBeCloseTo(first[1] + WALL_HEIGHT, 9);
    expect([roof[0], roof[2]]).toEqual([ground[0] + 3, ground[2] + 3]);
  });

  it('rejects unknown layouts', () => {
    expect(() => levelPlacement('stacked', 'ground')).toThrow(/Unknown layout/);
    expect(ROOF.lift).toBeGreaterThan(0);
  });
});

describe('room size tags', () => {
  const house = buildHouse({ cutaway: false });

  it('tags every finished ground room, never the furniture', () => {
    const ground = house.levels[0];
    const tags = roomDimensions(ground.spec);
    expect(tags.map((tag) => tag.id)).toEqual(['kitchen', 'bathroom', 'living', 'stair']);
    const kitchen = tags.find((tag) => tag.id === 'kitchen');
    expect(kitchen.size.map((v) => Number(v.toFixed(2)))).toEqual([3.2, 1.75]);
    expect(kitchen.area).toBeCloseTo(5.6, 9);
  });

  it('gives every finished room its size and area', () => {
    const first = house.levels[1];
    const tags = roomDimensions(first.spec);
    expect(tags.map((tag) => tag.id)).toEqual(['hall', 'bedroom2', 'bedroom1']);
    const bedroom1 = tags.find((tag) => tag.id === 'bedroom1');
    expect(bedroom1.size.map((v) => Number(v.toFixed(2)))).toEqual([4.25, 2.75]);
    expect(bedroom1.area).toBeCloseTo(11.6875, 9);
  });
});
