import { describe, expect, it } from 'vitest';
import { clearWidthGrid, routeIsClear } from '../src/checks/circulation.js';
import { buildHouse, levelById } from '../src/model/house.js';

const WALKWAY = 0.9;

describe('ground-floor circulation', () => {
  const ground = levelById(buildHouse({ cutaway: false }), 'ground').model;
  const grid = clearWidthGrid(ground);
  // Just inside the front door, against the street-wall column beside the stair.
  const frontDoor = [2.45, 6.9];

  it.each([
    ['the stair foot', [3.35, 6.0]],
    ['inside the kitchen door, under the flight', [5.15, 2.6]],
    ['the kitchen\'s cooking end', [4.3, 1.5]],
    ['the hall, for the WC door', [1.9, 2.5]],
    ['the far side of the dining table', [3.9, 4.8]],
  ])('leaves a 0.90 m walk from the front door to %s', (_, target) => {
    expect(routeIsClear(grid, frontDoor, target, WALKWAY)).toBe(true);
  });

  it('measures doorways at their own width, so it can tell a squeeze from a walkway', () => {
    // The WC door is 0.70 m: passable for 0.70, not for a 0.90 walkway.
    expect(routeIsClear(grid, [2.4, 2.6], [2.4, 1.5], 0.7)).toBe(true);
    expect(routeIsClear(grid, [2.4, 2.6], [2.4, 1.5], WALKWAY)).toBe(false);
  });
});
