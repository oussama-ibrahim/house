import { describe, expect, it } from 'vitest';
import { wallOf } from './support.js';
import { FLOOR_TO_FLOOR, FOOTPRINT, SLAB_OPENING, UPPER_FOOTPRINT, UPPER_INTERIOR, WALL_HEIGHT, WORLD_PLACEMENT } from '../src/spec/global.js';
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
    const south = (spec) => wallOf(spec, 'south').at;
    expect(south(firstSpec) - south(groundSpec)).toBeCloseTo(1, 9);
    // The void is the slab opening as built, ending 1.80 m from the first level's street wall.
    expect(firstSpec.rooms.find((r) => r.id === 'void')).toMatchObject({ x: [...SLAB_OPENING.x], z: [...SLAB_OPENING.z] });
    expect(UPPER_INTERIOR.zMax - SLAB_OPENING.z[1]).toBeCloseTo(1.8, 9);
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
    expect(kitchen.area).toBeCloseTo(7.675, 9);
    expect(tags.find((tag) => tag.id === 'wc').size.map((v) => Number(v.toFixed(2)))).toEqual([2.75, 1.65]);
    expect(tags.find((tag) => tag.id === 'living').area).toBeCloseTo(20.7875, 9);
  });

  it('gives every room its size and area, the stair void included', () => {
    const first = house.levels[1];
    const tags = roomDimensions(first.spec);
    expect(tags.map((tag) => tag.id)).toEqual(['landing', 'shower', 'void', 'bedroom2', 'bedroom1']);
    const voidTag = tags.find((tag) => tag.id === 'void');
    expect(voidTag.size.map((v) => Number(v.toFixed(2)))).toEqual([1.25, 3]);
    expect(voidTag.area).toBeCloseTo(3.75, 9);
    const bedroom1 = tags.find((tag) => tag.id === 'bedroom1');
    expect(bedroom1.size.map((v) => Number(v.toFixed(2)))).toEqual([4.4, 3.85]);
    expect(bedroom1.area).toBeCloseTo(19.235, 9);
    expect(tags.find((tag) => tag.id === 'shower').size.map((v) => Number(v.toFixed(2)))).toEqual([2.3, 1.4]);
  });
});
