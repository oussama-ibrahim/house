import { describe, expect, it } from 'vitest';
import { FLOOR_TO_FLOOR, FOOTPRINT, UPPER_FOOTPRINT, WALL_HEIGHT, WORLD_PLACEMENT } from '../src/spec/global.js';
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
    expect([roof[0], roof[2]]).toEqual([ground[0] + 3.075, ground[2] + 4.1]);
  });

  it('keeps the shared north-west origin so the deeper first level overhangs the street', () => {
    expect(UPPER_FOOTPRINT.depth - FOOTPRINT.depth).toBeCloseTo(1, 9);
    const [groundSpec, firstSpec] = buildHouse({ cutaway: false }).levels.map((level) => level.spec);
    expect(firstSpec.size).toEqual([FOOTPRINT.width, UPPER_FOOTPRINT.depth]);
    const south = (spec) => spec.walls.find((w) => w.id === 'south').at;
    expect(south(firstSpec) - south(groundSpec)).toBeCloseTo(1, 9);
    // The void keeps the stair room's strip and runs on over the overhang.
    expect(firstSpec.rooms.find((r) => r.id === 'void')).toMatchObject({ x: groundSpec.rooms.find((r) => r.id === 'stair').x, z: [2.95, 8] });
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
    expect(tags.map((tag) => tag.id)).toEqual(['wc', 'kitchen', 'living', 'stair']);
    const kitchen = tags.find((tag) => tag.id === 'kitchen');
    expect(kitchen.size.map((v) => Number(v.toFixed(2)))).toEqual([2.75, 2.65]);
    expect(kitchen.area).toBeCloseTo(7.3625, 9);
    expect(tags.find((tag) => tag.id === 'wc').size.map((v) => Number(v.toFixed(2)))).toEqual([2.75, 1.65]);
    expect(tags.find((tag) => tag.id === 'living').area).toBeCloseTo(20.7575, 9);
  });

  it('gives every room its size and area, the stair void included', () => {
    const first = house.levels[1];
    const tags = roomDimensions(first.spec);
    expect(tags.map((tag) => tag.id)).toEqual(['landing', 'shower', 'void', 'bedroom2', 'bedroom1']);
    const voidTag = tags.find((tag) => tag.id === 'void');
    expect(voidTag.size.map((v) => Number(v.toFixed(2)))).toEqual([1.25, 5.05]);
    expect(voidTag.area).toBeCloseTo(6.3125, 9);
    const bedroom1 = tags.find((tag) => tag.id === 'bedroom1');
    expect(bedroom1.size.map((v) => Number(v.toFixed(2)))).toEqual([4.4, 3.85]);
    expect(bedroom1.area).toBeCloseTo(16.94, 9);
    expect(tags.find((tag) => tag.id === 'shower').size.map((v) => Number(v.toFixed(2)))).toEqual([2.3, 1.4]);
  });
});
