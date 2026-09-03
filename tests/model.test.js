import { describe, expect, it } from 'vitest';
import { CAMERA } from '../src/spec/global.js';
import { GROUND } from '../src/spec/ground.js';
import { STAIR } from '../src/spec/stair.js';
import { boxCorners, fitCamera, fitDistance, orbitPosition, projectPoint } from '../src/model/camera.js';
import { buildHouse, levelById } from '../src/model/house.js';
import { findPiece } from '../src/model/level.js';
import { handrailBox, handrailCentrelineY, nosings, soffitHeightAt, treadBoxes } from '../src/model/stair.js';

describe('stair geometry', () => {
  it('builds 15 stacked treads from the south wall face northward', () => {
    const treads = treadBoxes(STAIR);
    expect(treads).toHaveLength(15);
    expect(treads[0]).toMatchObject({ min: [4.55, 0, 5.55], max: [5.8, 0.18, 5.8] });
    expect(treads[14]).toMatchObject({ min: [4.55, 2.3, 2.05], max: [5.8, 2.7, 2.3] });
  });

  it('keeps the store door under a soffit at least as high as its head', () => {
    const p3 = GROUND.walls.find((w) => w.id === 'P3');
    const storeDoor = p3.openings.find((o) => o.id === GROUND.understair.door);
    // Sample the clear opening between the jambs; the south jamb itself sits on a riser line.
    for (let z = storeDoor.from + 0.025; z < storeDoor.to - 0.025; z += 0.05) {
      expect(soffitHeightAt(STAIR, z), `soffit at z ${z.toFixed(2)}`).toBeGreaterThanOrEqual(storeDoor.head);
    }
    // The usable store ends where the soffit drops below 1.20 m.
    expect(soffitHeightAt(STAIR, GROUND.understair.z[1] - 0.01)).toBeGreaterThanOrEqual(1.2);
    expect(soffitHeightAt(STAIR, GROUND.understair.z[1] + 0.05)).toBeLessThan(1.2);
  });

  it('keeps the handrail 0.90 above every nosing on the east wall and gives the rotated box', () => {
    for (const nosing of nosings(STAIR)) expect(handrailCentrelineY(STAIR, nosing.z) - nosing.y).toBeCloseTo(0.9, 9);
    const rail = handrailBox(STAIR);
    expect(rail.centre[0]).toBeCloseTo(5.725, 9);
    expect(rail.centre[1]).toBeCloseTo(2.43, 9);
    expect(rail.centre[2]).toBeCloseTo(3.925, 9);
    expect(rail.size[2]).toBeCloseTo(4.005, 3);
    expect(rail.rotationX).toBeCloseTo(Math.atan(0.18 / 0.25), 9);
  });
});

describe('camera', () => {
  it('fits a box exactly to the frame edge at the margin', () => {
    // A 2 m cube seen head-on from +Z with a 90° lens: the near face must sit at depth 1, so distance 2.
    const cube = { min: [-1, -1, -1], max: [1, 1, 1] };
    const view = { azimuth: 0, polar: Math.PI / 2, target: [0, 0, 0] };
    expect(fitDistance(view, boxCorners(cube), { fov: 90, aspect: 1, margin: 1 })).toBeCloseTo(2, 9);
    // A wider frame does not change the vertical constraint; a tighter margin backs off.
    expect(fitDistance(view, boxCorners(cube), { fov: 90, aspect: 2, margin: 1 })).toBeCloseTo(2, 9);
    expect(fitDistance(view, boxCorners(cube), { fov: 90, aspect: 1, margin: 0.5 })).toBeCloseTo(3, 9);
  });

  it('centres the projected picture, not the 3D box, when fitting from a raised camera', () => {
    // A flat 12 × 6 m slab seen from 35° up: its near edge projects much lower than its far edge.
    const slab = { min: [-6, 0, -3], max: [6, 0.3, 3] };
    const angles = { azimuth: 0.86, polar: 0.95 };
    const lens = { fov: 45, aspect: 1.5, margin: 0.9 };
    const fit = fitCamera(angles, boxCorners(slab), lens);
    const projected = boxCorners(slab).map((p) => projectPoint({ ...angles, ...fit }, p, lens));
    const centreY = (Math.min(...projected.map((p) => p[1])) + Math.max(...projected.map((p) => p[1]))) / 2;
    const centreX = (Math.min(...projected.map((p) => p[0])) + Math.max(...projected.map((p) => p[0]))) / 2;
    expect(Math.abs(centreY)).toBeLessThan(0.01);
    expect(Math.abs(centreX)).toBeLessThan(0.01);
    // Everything stays inside the margin, and the centred fit is closer than the naive one.
    for (const [x, y] of projected) expect(Math.max(Math.abs(x), Math.abs(y))).toBeLessThanOrEqual(0.9 + 1e-6);
    const naiveTarget = [0, 0.15, 0];
    expect(fit.distance).toBeLessThan(fitDistance({ ...angles, target: naiveTarget }, boxCorners(slab), lens));
  });

  it('places the default camera to the south-east, above the house', () => {
    const [x, y, z] = orbitPosition(CAMERA);
    expect(x).toBeCloseTo(21 * Math.sin(0.95) * Math.sin(0.86), 9);
    expect(y).toBeCloseTo(1.1 + 21 * Math.cos(0.95), 9);
    expect(z).toBeCloseTo(21 * Math.sin(0.95) * Math.cos(0.86), 9);
    expect(x).toBeGreaterThan(0);
    expect(z).toBeGreaterThan(0);
  });
});

describe('level models', () => {
  const house = buildHouse({ cutaway: false });
  const ground = levelById(house, 'ground').model;
  const first = levelById(house, 'first').model;

  it('expands composite furniture into parts', () => {
    const chair = findPiece(ground, 'chairW');
    expect(chair.boxes).toHaveLength(2);
    expect(chair.boxes[1]).toMatchObject({ min: [1.875, 0.45, 2.875], max: [1.955, 0.9, 3.325] });
    expect(findPiece(ground, 'diningTable').boxes).toHaveLength(5);
    const leaf = findPiece(ground, 'slidingLeaf', { dressing: true });
    expect(leaf.boxes.map((b) => b.material)).toEqual(['glazing', 'frame', 'frame', 'frame', 'frame']);
  });

  it('gives the first level a two-box slab and finish patches for every room rectangle but the void', () => {
    expect(first.slabs.map((s) => [s.min[0], s.max[0], s.min[2], s.max[2]])).toEqual([
      [0, 4.55, 0, 6],
      [4.55, 6, 0, 2.05],
    ]);
    expect(first.floors.map((f) => f.room)).toEqual(['hall', 'hall', 'bedroom2', 'bedroom1']);
    expect(first.treads).toHaveLength(0);
    expect(first.handrail).toBeNull();
  });

  it('puts the stair only on the ground level', () => {
    expect(ground.treads).toHaveLength(15);
    expect(ground.handrail.id).toBe('handrail');
  });

  it('switches wall height with the cutaway flag', () => {
    const cutaway = buildHouse({ cutaway: true });
    expect(cutaway.wallHeight).toBe(1.2);
    expect(house.wallHeight).toBe(2.6);
    const pier = levelById(cutaway, 'ground').model.walls[0].solids[0];
    expect(pier.max[1]).toBe(1.2);
  });
});
