import { describe, expect, it } from 'vitest';
import { EPS } from '../src/model/box.js';
import { buildHouse, levelById } from '../src/model/house.js';
import { FRONT_LINE } from '../src/spec/facades.js';
import { FLOOR_TO_FLOOR, FOOTPRINT, WALL_HEIGHT } from '../src/spec/global.js';
import { openingOf } from './support.js';

describe("the parents' garage", () => {
  const { spec, model } = levelById(buildHouse({ cutaway: false }), 'ground');
  const boxes = model.neighbours.flatMap((entry) => entry.boxes);
  const xs = [Math.min(...boxes.map((b) => b.min[0])), Math.max(...boxes.map((b) => b.max[0]))];

  it('stands against the party wall, wholly outside the plot', () => {
    expect(xs[0]).toBeCloseTo(FOOTPRINT.width);
    for (const box of boxes) expect(box.min[0], box.id).toBeGreaterThanOrEqual(FOOTPRINT.width - EPS);
  });

  it('is a standard single-car bay whose walls run as deep as the plot', () => {
    const structure = model.neighbours.find((entry) => entry.piece.id === 'garage').boxes;
    const walls = structure.filter((b) => b.max[1] <= WALL_HEIGHT + EPS);
    expect(xs[1] - xs[0]).toBeCloseTo(3.0);
    expect(Math.min(...walls.map((b) => b.min[2]))).toBeCloseTo(0);
    expect(Math.max(...walls.map((b) => b.max[2]))).toBeCloseTo(FOOTPRINT.depth);
  });

  it('is roofed by the ground level\'s ceiling slab, carried forward to the overhang\'s front line', () => {
    const roof = boxes.find((b) => b.min[1] >= WALL_HEIGHT - EPS);
    expect(roof.min[1]).toBeCloseTo(WALL_HEIGHT);
    expect(roof.max[1]).toBeCloseTo(FLOOR_TO_FLOOR);
    expect(roof.max[2]).toBeCloseTo(FRONT_LINE);
  });

  it('rings its roof with a 1 m parapet on the three sides away from the house', () => {
    const parapet = model.neighbours.find((entry) => entry.piece.id === 'garageParapet').boxes;
    for (const box of parapet) {
      expect(box.min[1]).toBeCloseTo(FLOOR_TO_FLOOR);
      expect(box.max[1] - box.min[1]).toBeCloseTo(1.0);
    }
    const reaches = (axis, value, side) => parapet.some((b) => Math.abs(b[side][axis] - value) < EPS);
    expect(reaches(2, 0, 'min')).toBe(true);
    expect(reaches(2, FRONT_LINE, 'max')).toBe(true);
    expect(reaches(0, xs[1], 'max')).toBe(true);
    // The west side meets the house's own wall, so it carries none.
    expect(parapet.every((b) => b.min[0] >= FOOTPRINT.width - EPS)).toBe(true);
    expect(parapet.filter((b) => b.max[0] - b.min[0] < 1).every((b) => b.min[0] > FOOTPRINT.width + 1)).toBe(true);
  });

  it('is open to the street with no door: nothing stands in the bay below its head', () => {
    const bay = { x: [xs[0] + 0.1, xs[1] - 0.3], y: [0.05, 2.35], z: [FOOTPRINT.depth - 0.3, FOOTPRINT.depth] };
    const inBay = (b) => [0, 1, 2].every((axis) => b.min[axis] < Object.values(bay)[axis][1] && b.max[axis] > Object.values(bay)[axis][0]);
    expect(boxes.filter(inBay).map((b) => b.id)).toEqual([]);
  });

  it('is context, not plan: no room, wall or furniture of the level reaches past the party wall', () => {
    expect(spec.walls.every((wall) => (wall.axis === 'z' ? wall.at + wall.thickness / 2 : wall.to) <= FOOTPRINT.width + EPS)).toBe(true);
    expect(model.furniture.flatMap((entry) => entry.boxes).every((b) => b.max[0] <= FOOTPRINT.width + EPS)).toBe(true);
  });

  it('dresses its street face like the house front, with the downlights in the overhang\'s row', () => {
    const house = levelById(buildHouse({ cutaway: false }), 'ground').model;
    const lights = (entries, id) => entries.find((entry) => entry.piece.id === id).boxes;
    const rowZ = (boxes) => new Set(boxes.map((b) => b.min[2].toFixed(3)));
    expect(rowZ(lights(model.neighbours, 'garageLights'))).toEqual(rowZ(lights(house.facadeDressing, 'soffitLights')));
    const panel = lights(model.neighbours, 'garageBayPanel');
    for (const box of panel) expect(box.min[2]).toBeCloseTo(FOOTPRINT.depth);
  });
});

describe('the terrace on the garage roof', () => {
  const house = buildHouse({ cutaway: false });
  const first = levelById(house, 'first');
  const garage = levelById(house, 'ground').model.neighbours;
  const door = openingOf(first.spec, 'east', 'D13');
  const roof = garage.find((entry) => entry.piece.id === 'garage').boxes.find((b) => b.min[1] >= WALL_HEIGHT - EPS);
  const parapet = garage.find((entry) => entry.piece.id === 'garageParapet').boxes;

  it('opens off the landing through a sliding glass door at least 0.90 m wide', () => {
    expect(door.kind).toBe('door');
    expect(door.sill).toBe(0);
    expect(door.to - door.from).toBeGreaterThanOrEqual(0.9 - EPS);
    const landing = first.spec.rooms.find((r) => r.id === 'landing');
    expect(door.from).toBeGreaterThanOrEqual(landing.z[0] - EPS);
    expect(door.to).toBeLessThanOrEqual(landing.z[1] + EPS);
  });

  it('steps out level: the garage roof is flush with the first floor', () => {
    expect(roof.max[1]).toBeCloseTo(FLOOR_TO_FLOOR);
    expect(door.from).toBeGreaterThanOrEqual(roof.min[2]);
    expect(door.to).toBeLessThanOrEqual(roof.max[2]);
  });

  it('is guarded by the 1 m parapet', () => {
    for (const box of parapet) expect(box.max[1] - roof.max[1]).toBeGreaterThanOrEqual(1.0 - EPS);
  });
});
