import { describe, expect, it } from 'vitest';
import { buildHouse, levelById } from '../src/model/house.js';
import { chainPositions, doorSwing, footprint, metres, planPaperSize, planSvg, SCALE, tagOf, wallSegments } from '../src/drawing/plan.js';
import { drawingSetHtml, scheduleRows } from '../src/drawing/sheet.js';
import { wall, door, windowOpening } from '../src/spec/helpers.js';
import { openingOf, wallOf } from './support.js';

const house = buildHouse({ cutaway: false });
const ground = levelById(house, 'ground');
const first = levelById(house, 'first');
const site = ground.model.neighbours;
const expectDirection = (actual, expected) => actual.forEach((v, i) => expect(v).toBeCloseTo(expected[i]));
const leafOf = (level, id) => {
  const entry = level.model.dressing.find((e) => e.piece.id === `door${id}`);
  const rects = entry.boxes.map(footprint);
  return { x: [Math.min(...rects.map((r) => r.x[0])), Math.max(...rects.map((r) => r.x[1]))], z: [Math.min(...rects.map((r) => r.z[0])), Math.max(...rects.map((r) => r.z[1]))] };
};

describe('plan geometry', () => {
  it('writes lengths the French way', () => {
    expect(metres(1.5)).toBe('1,50');
    expect(metres(0.045)).toBe('0,04');
    expect(metres(6.15)).toBe('6,15');
  });

  it('cuts a wall into the solid stretches between its openings', () => {
    const w = wall('w', 'x', 0.1, 0.2, 0, 5, [windowOpening('a', 3, 4, 0.9, 2.4), door('b', 1, 2, 2.1)]);
    expect(wallSegments(w)).toEqual([[0, 1], [2, 3], [4, 5]]);
    const flush = wall('f', 'x', 0.1, 0.2, 0, 2, [door('c', 0, 1, 2.1), windowOpening('d', 1, 2, 0.9, 2.4)]);
    expect(wallSegments(flush)).toEqual([]);
  });

  it('hinges the front door on its west jamb and swings it a quarter turn into the house', () => {
    const d1 = openingOf(ground.spec, 'south', 'D1');
    const swing = doorSwing(wallOf(ground.spec, 'south'), d1, leafOf(ground, 'D1'));
    expect(swing.hinge[0]).toBeCloseTo(d1.from);
    expectDirection(swing.open, [0, -1]);
    expect(swing.stops).toHaveLength(2);
    expect(swing.radius).toBeCloseTo(d1.to - d1.from);
  });

  it('opens the kitchen door under the stair into the kitchen, hinged on its east jamb', () => {
    const d3 = openingOf(ground.spec, 'P6', 'D3');
    const swing = doorSwing(wallOf(ground.spec, 'P6'), d3, leafOf(ground, 'D3'));
    expect(swing.hinge[0]).toBeCloseTo(d3.to);
    expectDirection(swing.open, [0, -1]);
  });

  it('ticks every opening edge from corner to corner along an exterior wall', () => {
    expect(chainPositions(wallOf(ground.spec, 'south'), ground.spec.size)).toEqual([0, 0.3, 1.8, 1.95, 2.95, 3.2, 5.1, 5.55, 6.15]);
    expect(chainPositions(wallOf(ground.spec, 'east'), ground.spec.size)).toEqual([0, 7.2]);
  });

  it('tags windows F and doors P', () => {
    expect(tagOf({ id: 'Win11' })).toBe('F11');
    expect(tagOf({ id: 'D13' })).toBe('P13');
  });
});

describe('the contractor\'s sheets', () => {
  it('draws each level true to 1:50', () => {
    for (const level of house.levels) {
      const svg = planSvg(level, site);
      const [, , width, height] = svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
      const [paperW, paperH] = planPaperSize(svg);
      expect(paperW / width).toBeCloseTo(SCALE, 9);
      expect(paperH / height).toBeCloseTo(SCALE, 9);
    }
  });

  it('tags every opening of the level on its plan and lists it in the schedule', () => {
    for (const level of house.levels) {
      const svg = planSvg(level, site);
      const openings = level.spec.walls.flatMap((w) => w.openings).filter((o) => o.kind !== 'column');
      const rows = scheduleRows(level.spec);
      expect(rows.map((r) => r.tag).sort()).toEqual(openings.map(tagOf).sort());
      for (const o of openings) expect(svg).toContain(`>${tagOf(o)}<`);
    }
  });

  it('reads each schedule row from its opening: size, sill and lintel', () => {
    const f11 = scheduleRows(first.spec).find((r) => r.tag === 'F11');
    expect(f11.width).toBeCloseTo(1.8);
    expect([f11.sill, f11.head]).toEqual([0.9, 2.4]);
    expect(f11.height).toBeCloseTo(1.5);
    const p13 = scheduleRows(first.spec).find((r) => r.tag === 'P13');
    expect(p13.designation).toBe('Porte coulissante vitrée');
    expect(scheduleRows(ground.spec).find((r) => r.tag === 'P1').designation).toBe("Porte d'entrée");
  });

  it('puts the garage beside the ground floor and the terrace beside the first', () => {
    expect(planSvg(ground, site)).toContain('Garage — maison des parents');
    expect(planSvg(first, site)).toContain('Terrasse sur toit du garage');
  });

  it('prints one A3 landscape page per level, each marked as a concept drawing', () => {
    const html = drawingSetHtml(house.levels, site, '12/10/2026');
    expect(html).toContain('@page { size: 420mm 297mm');
    expect(html.match(/<section class="page">/g)).toHaveLength(2);
    expect(html.match(/non destiné à l’exécution/g)).toHaveLength(2);
  });
});
