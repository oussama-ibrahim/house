import { describe, expect, it } from 'vitest';
import { CUTAWAY_WALL_HEIGHT, WALL_HEIGHT } from '../src/spec/global.js';
import { door, wall, windowOpening } from '../src/spec/helpers.js';
import { GROUND } from '../src/spec/ground.js';
import { SpecError } from '../src/model/errors.js';
import { size } from '../src/model/box.js';
import { splitWall, validateWall } from '../src/model/walls.js';

const wallById = (id) => GROUND.walls.find((w) => w.id === id);
const byRole = (solids, role) => solids.filter((s) => s.role === role);

describe('splitWall', () => {
  it('emits a pier between every pair of openings plus sills and lintels', () => {
    const { solids, glazing } = splitWall(wallById('north'), WALL_HEIGHT);
    const piers = byRole(solids, 'pier').map((p) => [p.min[0], p.max[0]]);
    expect(piers).toEqual([
      [0, 1.6],
      [2.6, 4.5],
      [5.3, 6],
    ]);
    expect(byRole(solids, 'sill').map((s) => s.max[1])).toEqual([1.1, 1.4]);
    expect(byRole(solids, 'lintel').map((l) => [l.min[1], l.max[1]])).toEqual([
      [2.2, 2.6],
      [2.2, 2.6],
    ]);
    expect(glazing.map((g) => g.opening)).toEqual(['Win2', 'Win1']);
    for (const box of solids) expect(size(box).every((v) => v > 0)).toBe(true);
  });

  it('handles an opening flush with the wall end without a degenerate pier', () => {
    const { solids } = splitWall(wallById('P3'), WALL_HEIGHT);
    expect(byRole(solids, 'pier').map((p) => [p.min[2], p.max[2]])).toEqual([
      [2.05, 2.1],
      [2.8, 4.8],
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
    expect([glazing[1].min[1], glazing[1].max[1]]).toEqual([0.9, 2.2]);
  });

  it('leaves the blind east wall solid and glazes the kitchen screen from floor to ceiling', () => {
    const east = splitWall(wallById('east'), WALL_HEIGHT);
    expect(east.solids).toHaveLength(1);
    expect(east.glazing).toHaveLength(0);
    expect(east.frames).toHaveLength(0);

    const p1 = splitWall(wallById('P1'), WALL_HEIGHT);
    const glass = p1.glazing.find((g) => g.opening === 'G1');
    expect([glass.min[1], glass.max[1]]).toEqual([0, WALL_HEIGHT]);
    expect(p1.solids.some((s) => s.id.startsWith('P1:G1:'))).toBe(false);
  });

  it('frames every window with jambs, rails and mullions, and a transom where asked', () => {
    const north = splitWall(wallById('north'), WALL_HEIGHT);
    const win2 = north.frames.filter((f) => f.opening === 'Win2').map((f) => f.id.split(':')[2]);
    expect(win2.sort()).toEqual(['headRail', 'jambA', 'jambB', 'sillRail'].sort());
    const win2Jamb = north.frames.find((f) => f.id === 'north:Win2:jambA');
    expect([win2Jamb.min[1], win2Jamb.max[1]]).toEqual([1.1, 2.2]);
    expect(win2Jamb.max[2] - win2Jamb.min[2]).toBeCloseTo(0.06, 6);

    const p1 = splitWall(wallById('P1'), WALL_HEIGHT);
    const g1 = p1.frames.filter((f) => f.opening === 'G1').map((f) => f.id.split(':')[2]);
    expect(g1).toContain('transom');
    expect(g1).toContain('mullion1');
    const d3 = p1.frames.filter((f) => f.opening === 'D3').map((f) => f.id.split(':')[2]);
    expect(d3.sort()).toEqual(['headRail', 'jambA', 'jambB'].sort());
    expect(p1.frames.some((f) => f.opening === 'D2')).toBe(false);
  });

  it('clips to the cutaway height: high sills become solid wall, doors lose their lintel', () => {
    const north = splitWall(wallById('north'), CUTAWAY_WALL_HEIGHT);
    const win1Sill = north.solids.find((s) => s.id === 'north:Win1:sill');
    expect(win1Sill.max[1]).toBe(1.2);
    expect(north.solids.some((s) => s.role === 'lintel')).toBe(false);
    // Win1's sill (1.40) is above the cut, so it has no pane; Win2's sill (1.10) leaves a 10 cm strip.
    expect(north.glazing.map((g) => [g.opening, g.min[1], g.max[1]])).toEqual([['Win2', 1.1, 1.2]]);

    const south = splitWall(wallById('south'), CUTAWAY_WALL_HEIGHT);
    expect(south.solids.some((s) => s.id.startsWith('south:D1'))).toBe(false);
    const win5 = south.glazing.find((g) => g.opening === 'Win5');
    expect([win5.min[1], win5.max[1]]).toEqual([0.9, 1.2]);
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
