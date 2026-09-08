import { describe, expect, it } from 'vitest';
import { CAMERA } from '../src/spec/global.js';
import { GROUND } from '../src/spec/ground.js';
import { STAIR } from '../src/spec/stair.js';
import { boxCorners, fitCamera, fitDistance, orbitPosition, projectPoint } from '../src/model/camera.js';
import { buildHouse, levelById } from '../src/model/house.js';
import { findPiece } from '../src/model/level.js';
import { guardParts, handrailBox, handrailCentrelineY, landingHeight, landingParts, nosings, starterRect, stringerBoxes, treadBoxes } from '../src/model/stair.js';

describe('stair geometry', () => {
  it('climbs three starter steps east, crosses the landing and takes the main flight north', () => {
    const treads = treadBoxes(STAIR);
    expect(treads).toHaveLength(15);
    expect(treads[0]).toMatchObject({ id: 'starter-1', min: [3.89, 0.14, 5.7], max: [4.16, 0.18, 7], material: 'marble' });
    expect(treads[2]).toMatchObject({ id: 'starter-3', min: [4.43, 0.5, 5.7], max: [4.7, 0.54, 7] });
    expect(treads[3]).toMatchObject({ id: 'landing', min: [4.7, 0.68, 5.7], max: [5.95, 0.72, 7], tread: 4 });
    expect(treads[4]).toMatchObject({ id: 'tread-1', min: [4.7, 0.86, 5.45], max: [5.95, 0.9, 5.7], tread: 5, material: 'marble' });
    expect(treads[14]).toMatchObject({ id: 'tread-11', min: [4.7, 2.66, 2.95], max: [5.95, 2.7, 3.2], tread: 15 });
    expect(landingHeight(STAIR)).toBeCloseTo(0.72, 9);
    expect(starterRect(STAIR)).toEqual({ x: [3.89, 4.7], z: [5.7, 7] });
    // The last riser reaches the upper floor exactly.
    expect(landingHeight(STAIR) + STAIR.riser * STAIR.risers).toBeCloseTo(2.88, 9);
  });

  it('carries both legs on stringers, the landing on four posts, and guards every open side', () => {
    const stringers = stringerBoxes(STAIR);
    expect(stringers.map((s) => s.id)).toEqual(['stringer-west', 'stringer-east', 'starter-stringer-north', 'starter-stringer-south']);
    const [west, east, starterNorth] = stringers;
    // The starter stringers climb east: as long as the leg's run and rise, rotated about Z.
    expect(starterNorth.size[0]).toBeCloseTo(Math.hypot(0.81, 0.54), 9);
    expect(starterNorth.rotationZ).toBeCloseTo(Math.atan(0.18 / 0.27), 9);
    expect(starterNorth.centre[2]).toBeCloseTo(5.71, 9);
    const landing = landingParts(STAIR);
    expect(landing.frame).toMatchObject({ min: [4.7, 0.48, 5.7], max: [5.95, 0.68, 7] });
    expect(landing.posts).toHaveLength(4);
    for (const post of landing.posts) expect([post.min[1], post.max[1]]).toEqual([0, 0.48]);
    expect(west.centre[0]).toBeCloseTo(4.71, 9);
    expect(east.centre[0]).toBeCloseTo(5.94, 9);
    // Both run from the landing to the top riser; their top edge sits just under the nosing line.
    expect(west.size[2]).toBeCloseTo(Math.hypot(2.75, 1.98), 9);
    expect(west.centre[1]).toBeCloseTo(handrailCentrelineY(STAIR, 4.325) - 0.9 - 0.2, 9);
    const guard = guardParts(STAIR);
    expect(guard.rails.map((rail) => rail.id)).toEqual(['guard-rail', 'starter-guard-rail']);
    expect(guard.rails[0].centre[0]).toBeCloseTo(4.72, 9);
    expect(guard.posts.map((post) => post.id)).toEqual([
      'guard-post-5',
      'guard-post-8',
      'guard-post-11',
      'guard-post-14',
      'starter-guard-post-1',
      'starter-guard-post-3',
      'guard-newel',
    ]);
    for (const post of guard.posts.slice(0, 6)) expect(post.max[1] - post.min[1]).toBeCloseTo(0.9 + 0.09 - 0.02, 9);
    // The newel stands on the landing and reaches the main rail's low end.
    expect([guard.posts[6].min[1], guard.posts[6].max[1]]).toEqual([0.72, 1.82]);
    // The living room floor runs under the flight: no wall stands along its west side.
    expect(GROUND.walls.find((w) => w.id === 'P3').to).toBeLessThanOrEqual(STAIR.bottomZ - STAIR.going * STAIR.treadCount);
  });

  it('keeps the handrail 0.90 above every nosing on the east wall and gives the rotated box', () => {
    for (const nosing of nosings(STAIR)) expect(handrailCentrelineY(STAIR, nosing.z) - nosing.y).toBeCloseTo(0.9, 9);
    const rail = handrailBox(STAIR);
    expect(rail.centre[0]).toBeCloseTo(5.875, 9);
    expect(rail.centre[1]).toBeCloseTo(2.79, 9);
    expect(rail.centre[2]).toBeCloseTo(4.325, 9);
    expect(rail.size[2]).toBeCloseTo(Math.hypot(2.25, 1.62), 9);
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
    expect(chair.boxes[1]).toMatchObject({ min: [1.675, 0.45, 3.625], max: [1.755, 0.9, 4.075] });
    expect(findPiece(ground, 'diningTable').boxes).toHaveLength(5);
    const leaf = findPiece(ground, 'slidingLeaf', { dressing: true });
    expect(leaf.boxes.map((b) => b.material)).toEqual(['glazing', 'frame', 'frame', 'frame', 'frame']);
  });

  it('cuts the first level slab to the void outline and gives finish patches to every room rectangle but the void', () => {
    expect(first.slabs.map((s) => [s.min[0], s.max[0], s.min[2], s.max[2]])).toEqual([
      [0, 4.7, 0, 8.2],
      [4.7, 6.15, 0, 2.95],
      [5.95, 6.15, 2.95, 8.2],
      [4.7, 5.95, 8, 8.2],
    ]);
    expect(first.floors.map((f) => f.room)).toEqual(['landing', 'landing', 'shower', 'bedroom2', 'bedroom1']);
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
