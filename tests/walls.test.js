import { describe, expect, it } from 'vitest';
import { CUTAWAY_WALL_HEIGHT, WALL_HEIGHT } from '../src/spec/global.js';
import { door, wall, windowOpening } from '../src/spec/helpers.js';
import { GROUND } from '../src/spec/ground.js';
import { SpecError } from '../src/model/errors.js';
import { size } from '../src/model/box.js';
import { cladSolids, envelopeFaces, splitWall, validateWall } from '../src/model/walls.js';
import { box } from '../src/model/box.js';

const wallById = (id) => GROUND.walls.find((w) => w.id === id);
const byRole = (solids, role) => solids.filter((s) => s.role === role);

describe('splitWall', () => {
  it('emits a pier between every pair of openings plus sills and lintels', () => {
    const { solids, glazing } = splitWall(wallById('north'), WALL_HEIGHT);
    const piers = byRole(solids, 'pier').map((p) => [p.min[0], p.max[0]]);
    expect(piers).toEqual([
      [0, 3.6],
      [5.7, 6.15],
    ]);
    expect(byRole(solids, 'sill').map((s) => s.max[1])).toEqual([1.1]);
    expect(byRole(solids, 'lintel').map((l) => [l.min[1], l.max[1]])).toEqual([[2.4, 2.6]]);
    expect(glazing.map((g) => g.opening)).toEqual(['Win2']);
    for (const box of solids) expect(size(box).every((v) => v > 0)).toBe(true);
  });

  it('handles an opening flush with the wall end without a degenerate pier', () => {
    const flush = wall('t', 'z', 4.65, 0.1, 2.95, 7.0, [door('D9', 3.0, 3.6, 1.9), door('D4', 6.0, 7.0, 2.2, { leaf: false })]);
    const { solids } = splitWall(flush, WALL_HEIGHT);
    expect(byRole(solids, 'pier').map((p) => [p.min[2], p.max[2]])).toEqual([
      [2.95, 3],
      [3.6, 6],
    ]);
    expect(byRole(solids, 'sill')).toHaveLength(0);
    expect(byRole(solids, 'lintel').map((l) => [l.min[1], l.max[1]])).toEqual([
      [1.9, 2.6],
      [2.2, 2.6],
    ]);
    for (const box of solids) expect(size(box).every((v) => v > 0)).toBe(true);
  });

  it('places thin glazing on the wall centreline', () => {
    const { glazing } = splitWall(wallById('west'), WALL_HEIGHT);
    expect(glazing.map((g) => g.opening)).toEqual(['Win3', 'Win4']);
    expect(glazing[0].min[0]).toBeCloseTo(0.09, 6);
    expect(glazing[0].max[0]).toBeCloseTo(0.11, 6);
    expect([glazing[1].min[1], glazing[1].max[1]]).toEqual([0.9, 2.4]);
  });

  it('leaves the blind east wall solid and the kitchen, hall and WC walls unglazed', () => {
    const east = splitWall(wallById('east'), WALL_HEIGHT);
    expect(east.solids).toHaveLength(1);
    expect(east.glazing).toHaveLength(0);
    expect(east.frames).toHaveLength(0);

    // The walls around the hall are solid apart from the WC door: no glazing anywhere.
    for (const id of ['P1', 'P8']) {
      const split = splitWall(wallById(id), WALL_HEIGHT);
      expect(split.glazing, id).toHaveLength(0);
      expect(split.frames, id).toHaveLength(0);
    }
  });

  it('frames every window with jambs, rails and mullions', () => {
    const north = splitWall(wallById('north'), WALL_HEIGHT);
    // The 2.10 m kitchen window is three panes: two mullions.
    const win2 = north.frames.filter((f) => f.opening === 'Win2').map((f) => f.id.split(':')[2]);
    expect(win2.sort()).toEqual(['headRail', 'jambA', 'jambB', 'mullion1', 'mullion2', 'sillRail'].sort());
    const win2Jamb = north.frames.find((f) => f.id === 'north:Win2:jambA');
    expect([win2Jamb.min[1], win2Jamb.max[1]]).toEqual([1.1, 2.4]);
    expect(win2Jamb.max[2] - win2Jamb.min[2]).toBeCloseTo(0.06, 6);

    // A door with a leaf gets no frame.
    const p1 = splitWall(wallById('P1'), WALL_HEIGHT);
    expect(p1.frames.some((f) => f.opening === 'D2')).toBe(false);
  });

  it('clips to the cutaway height: high sills become solid wall, doors lose their lintel', () => {
    const north = splitWall(wallById('north'), CUTAWAY_WALL_HEIGHT);
    expect(north.solids.some((s) => s.role === 'lintel')).toBe(false);
    // The kitchen sill (1.10) leaves a 10 cm strip of pane under the cut.
    expect(north.glazing.map((g) => [g.opening, g.min[1], g.max[1]])).toEqual([['Win2', 1.1, 1.2]]);

    const south = splitWall(wallById('south'), CUTAWAY_WALL_HEIGHT);
    expect(south.solids.some((s) => s.id.startsWith('south:D1'))).toBe(false);
    const win5 = south.glazing.find((g) => g.opening === 'Win5');
    expect([win5.min[1], win5.max[1]]).toEqual([0.9, 1.2]);
    // The WC window's sill (1.20) is at the cut: solid wall to the cut and no pane.
    const west = splitWall(wallById('west'), CUTAWAY_WALL_HEIGHT);
    expect(west.solids.find((s) => s.id === 'west:Win3:sill').max[1]).toBe(1.2);
    expect(west.glazing.some((g) => g.opening === 'Win3')).toBe(false);
  });

  it('rejects overlapping or out-of-range openings', () => {
    const overlapping = wall('t', 'x', 1, 0.1, 0, 6, [door('a', 1, 2, 2.05), door('b', 1.5, 2.5, 2.05)]);
    expect(() => validateWall(overlapping)).toThrow(SpecError);
    const outside = wall('t', 'x', 1, 0.1, 0.2, 5.8, [windowOpening('w', 5.5, 6.2, 0.9, 2.2)]);
    expect(() => validateWall(outside)).toThrow(/outside wall/);
    const flipped = wall('t', 'x', 1, 0.1, 0, 6, [windowOpening('w', 1, 2, 2.2, 0.9)]);
    expect(() => validateWall(flipped)).toThrow(/sill\/head/);
  });
});

describe('facade cladding', () => {
  const footprint = [6.15, 8.2];

  it('finds the faces of a box that lie on the footprint, corners included', () => {
    expect(envelopeFaces(box('corner', [0, 0, 8.0], [0.5, 2.6, 8.2], 'wall'), footprint)).toEqual(['nx', 'pz']);
    expect(envelopeFaces(box('inside', [1, 0, 1], [2, 2.6, 2], 'wall'), footprint)).toEqual([]);
  });

  it('clads only the outer faces of exterior walls and leaves partitions and unfinished levels alone', () => {
    const south = wall('south', 'x', 8.1, 0.2, 0, 6.15, [windowOpening('W', 1, 2, 0.9, 2.4)], { exterior: true });
    const { solids } = splitWall(south, WALL_HEIGHT);
    const clad = cladSolids(solids, south, footprint, 'cladding');
    for (const solid of clad) {
      expect(solid.faces.pz).toBe('cladding');
      expect(solid.faces.nz).toBeUndefined();
    }
    expect(clad.find((s) => s.min[0] === 0).faces.nx).toBe('cladding');

    const partition = wall('P', 'x', 4, 0.1, 0.2, 5.95);
    expect(cladSolids(splitWall(partition, WALL_HEIGHT).solids, partition, footprint, 'cladding')[0].faces).toBeUndefined();
    expect(cladSolids(solids, south, footprint, undefined)).toBe(solids);
  });
});
