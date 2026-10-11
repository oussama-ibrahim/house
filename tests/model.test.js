import { describe, expect, it } from 'vitest';
import { CAMERA, COLUMN, WALL_HEIGHT } from '../src/spec/global.js';
import { GROUND } from '../src/spec/ground.js';
import { STAIR } from '../src/spec/stair.js';
import { boxCorners, fitCamera, fitDistance, orbitPosition, projectPoint } from '../src/model/camera.js';
import { buildHouse, levelById } from '../src/model/house.js';
import { runAcceptanceChecks } from '../src/checks/index.js';
import { checkStairAlignment, checkStairWidth } from '../src/checks/stair.js';
import { room, roomRects, wall } from '../src/spec/helpers.js';
import { buildLevel, findPiece, findRoom, findWall } from '../src/model/level.js';
import { EPS, intersects, planGap, rectsOverlapInPlan } from '../src/model/box.js';
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
    // A cross wall may close the flight's top end; nothing may run along its west side.
    const westSide = { x: [STAIR.x[0] - 0.15, STAIR.x[0]], z: [STAIR.bottomZ - STAIR.going * STAIR.treadCount, STAIR.bottomZ] };
    for (const w of GROUND.walls.filter((candidate) => !candidate.exterior && candidate.axis === 'z')) {
      const half = w.thickness / 2;
      const rect = w.axis === 'x' ? { x: [w.from, w.to], z: [w.at - half, w.at + half] } : { x: [w.at - half, w.at + half], z: [w.from, w.to] };
      expect(rectsOverlapInPlan(rect, westSide), w.id).toBe(false);
    }
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
    expect(chair.boxes[1]).toMatchObject({ min: [1.555, 0.45, 4.55], max: [1.635, 0.9, 5] });
    expect(findPiece(ground, 'diningTable').boxes).toHaveLength(5);
    const plant = findPiece(ground, 'plant', { dressing: true });
    expect(plant.boxes.map((b) => b.material)).toEqual(['joinery', 'structure']);
  });

  it('cuts the first level slab to the void outline and gives finish patches to every room rectangle but the void', () => {
    expect(first.slabs.map((s) => [s.min[0], s.max[0], s.min[2], s.max[2]])).toEqual([
      [0, 4.7, 0, 8.2],
      [4.7, 6.15, 0, 2.95],
      [5.95, 6.15, 2.95, 8.2],
      [4.7, 5.95, 8, 8.2],
    ]);
    expect(first.floors.map((f) => f.room)).toEqual(['landing', 'landing', 'shower', 'bedroom2', 'bedroom2', 'bedroom2', 'bedroom1']);
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

describe('column C1', () => {
  const house = buildHouse();
  const zoneBox = (zone) => ({ min: [zone.x[0], 0, zone.z[0]], max: [zone.x[1], 2, zone.z[1]] });

  it('stands at the measured position on both levels, 0.25 × 0.25, floor to slab', () => {
    for (const level of house.levels) {
      const { envelope } = findWall(level.model, 'C1');
      expect([envelope.min[0], envelope.max[0], envelope.min[2], envelope.max[2]]).toEqual([...COLUMN.x, ...COLUMN.z]);
      expect(envelope.max[1] - envelope.min[1]).toBe(level.model.wallHeight);
    }
    // 2.95 m from the party wall's outer face and 4.20 m from the street front's, to the near edges.
    const ground = levelById(house, 'ground').spec;
    expect(ground.size[0] - COLUMN.x[1]).toBeCloseTo(2.95, 9);
    expect(ground.size[1] - COLUMN.z[1]).toBeCloseTo(4.2, 9);
  });

  it('keeps out of every door clear zone', () => {
    for (const level of house.levels) {
      const { envelope } = findWall(level.model, 'C1');
      // Touching is allowed: bedroom 2's door jamb sits flush on the column's south face.
      for (const zone of level.spec.clearZones) expect(intersects(envelope, zoneBox(zone)), `${level.spec.id} ${zone.opening}`).toBe(false);
    }
  });

  it('is buried downstairs: it ends the column-line wall, flush with it on both sides', () => {
    const ground = levelById(house, 'ground').model;
    const column = findWall(ground, 'C1').envelope;
    const p8 = findWall(ground, 'P8').envelope;
    const back = findWall(ground, 'P8b').envelope;
    // The column-line wall has the column's width; past the niche its back runs on to the column,
    // flush with it on the kitchen side.
    expect([p8.min[0], p8.max[0]]).toEqual([column.min[0], column.max[0]]);
    expect([back.max[0], back.max[2]]).toEqual([column.max[0], column.min[2]]);
    // No part of the living room, the hall or the kitchen overlaps the column: nothing of it stands proud.
    const plan = { x: [column.min[0], column.max[0]], z: [column.min[2], column.max[2]] };
    for (const id of ['living', 'kitchen']) {
      for (const rect of roomRects(findRoom(ground, id))) expect(rectsOverlapInPlan(rect, plan), id).toBe(false);
    }
  });

  it('closes the kitchen with a full-height glass wall from the column to the flight: a fixed pane and a 0.90 m sliding door', () => {
    const ground = levelById(house, 'ground');
    const p10 = ground.spec.walls.find((w) => w.id === 'P10');
    expect([p10.from, p10.to]).toEqual([COLUMN.x[1], STAIR.x[0]]);
    const [pane, slider] = p10.openings;
    expect([pane.kind, pane.sill, pane.head, pane.transom]).toEqual(['window', 0, WALL_HEIGHT, null]);
    expect([slider.kind, slider.leaf, slider.frame, slider.head]).toEqual(['door', false, true, WALL_HEIGHT]);
    expect(slider.to - slider.from).toBeCloseTo(0.9, 9);
    // Flush with the column's south face on the living side.
    expect(findWall(ground.model, 'P10').envelope.max[2]).toBe(COLUMN.z[1]);
  });

  it('builds the hall unit into a niche in the wall, flush with its face, from P1 to the column', () => {
    const ground = levelById(house, 'ground').model;
    const boxes = findPiece(ground, 'hallUnit').boxes;
    const p8 = findWall(ground, 'P8').envelope;
    const back = findWall(ground, 'P8b').envelope;
    // Front flush with the wall's hall face, back on the niche's back.
    expect(Math.min(...boxes.map((b) => b.min[0]))).toBe(p8.min[0]);
    expect(Math.max(...boxes.map((b) => b.max[0]))).toBe(back.min[0]);
    // It fills the niche from the WC wall to the column.
    expect(Math.min(...boxes.map((b) => b.min[2]))).toBe(p8.max[2]);
    expect(Math.max(...boxes.map((b) => b.max[2]))).toBe(COLUMN.z[0]);
  });

  it('keeps the hall for the WC door alone, the column-line wall solid', () => {
    const ground = levelById(house, 'ground').spec;
    expect(ground.walls.find((w) => w.id === 'P1').openings.map((o) => o.id)).toEqual(['D2']);
    for (const id of ['P8', 'P8b']) expect(ground.walls.find((w) => w.id === id).openings, id).toEqual([]);
  });

  it('puts the stair arrival over the kitchen', () => {
    const check3 = runAcceptanceChecks().find((check) => check.id === 3);
    expect(check3.pass).toBe(true);
    expect(check3.details.join(' ')).toContain('over kitchen');
  });

  it('names only a wall running with the flight as its flank, never a cross wall ending at it', () => {
    // A cross wall ending on the flight's west edge, overlapping the top tread's depth.
    const crossWall = wall('X', 'x', 2.95, 0.1, COLUMN.x[1], STAIR.x[0]);
    const levels = house.levels.map((level) => {
      if (level.spec.id !== 'ground') return level;
      const spec = { ...level.spec, walls: [...level.spec.walls, crossWall] };
      return { ...level, spec, model: buildLevel(spec) };
    });
    const check4 = checkStairWidth({ ...house, levels });
    expect(check4.pass).toBe(true);
    expect(check4.details[0]).toMatch(/^guard at 4\.70/);
  });

  it('finds the room under the arrival through any of its rectangles, not only the first', () => {
    // A kitchen whose first rectangle stops short of the stair strip: the arrival lies over an extra one.
    const reordered = room('kitchen', 'Kitchen', [1.85, 4.7], [0.2, 2.25], 'marble', 10.2, { extra: [{ x: [4.7, 5.95], z: [0.2, 2.85] }] });
    const levels = house.levels.map((level) =>
      level.spec.id === 'ground' ? { ...level, spec: { ...level.spec, rooms: level.spec.rooms.map((r) => (r.id === 'kitchen' ? reordered : r)) } } : level,
    );
    const check3 = checkStairAlignment({ ...house, levels });
    expect(check3.failures).toEqual([]);
  });

  it('is closed off upstairs: the wardrobe runs to it and N1 fills the gap to P5', () => {
    const first = levelById(house, 'first').model;
    const column = findWall(first, 'C1').envelope;
    const infill = findWall(first, 'N1').envelope;
    const p5 = findWall(first, 'P5').envelope;
    expect([infill.min[0], infill.max[0]]).toEqual([column.max[0], p5.min[0]]);
    const [wardrobe] = findPiece(first, 'wardrobe2').boxes;
    expect([wardrobe.min[0], wardrobe.max[2]]).toEqual([column.min[0], column.min[2]]);
  });
});
