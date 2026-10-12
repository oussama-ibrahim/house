import { describe, expect, it } from 'vitest';
import { EPS, intersects } from '../src/model/box.js';
import { buildHouse } from '../src/model/house.js';
import { furnitureBoxList } from '../src/model/level.js';
import { roofBoxes } from '../src/model/roof.js';
import { DESIGNS } from '../src/spec/designs.js';
import { ROOF_FRONT } from '../src/spec/facades.js';
import { SLAB_THICKNESS } from '../src/spec/global.js';
import { ROOF } from '../src/spec/presentation.js';

describe('the street front', () => {
  const house = buildHouse({ cutaway: false, design: 'a' });
  // Whether a box stands beyond the outer face of the level's south, east or west wall.
  const faceOf = (spec, wall) => ({
    south: (box) => box.min[2] >= spec.size[1] - EPS,
    east: (box) => box.min[0] >= spec.size[0] - EPS,
    west: (box) => box.max[0] <= EPS,
  })[wall];

  it('dresses both levels', () => {
    for (const { model } of house.levels) expect(model.facadeDressing.length).toBeGreaterThan(0);
  });

  it('hangs every piece outside its wall: beyond the level\'s face, or under the overhang\'s slab', () => {
    for (const { spec, model } of house.levels) {
      for (const { wall, boxes } of model.facadeDressing) {
        const face = faceOf(spec, wall);
        for (const box of boxes) {
          const outside = face(box) || box.max[1] <= -SLAB_THICKNESS + EPS;
          expect(outside, `${box.id} on ${wall}`).toBe(true);
        }
      }
    }
  });

  it('cuts into no wall and no furniture', () => {
    for (const { model } of house.levels) {
      const solids = [...model.walls.map((entry) => entry.envelope), ...furnitureBoxList(model)];
      for (const { boxes } of model.facadeDressing) {
        for (const box of boxes) for (const solid of solids) expect(intersects(box, solid), `${box.id} in ${solid.id}`).toBe(false);
      }
    }
  });

  it('keeps the bedroom window clear of the panel round it', () => {
    const first = house.levels.find(({ spec }) => spec.id === 'first');
    const window = first.spec.walls.find((wall) => wall.id === 'south').openings.find((o) => o.id === 'Win11');
    const panel = first.model.facadeDressing.find((entry) => entry.piece.id === 'windowPanel').boxes;
    const overlapsWindow = (box) => box.min[0] < window.to - EPS && box.max[0] > window.from + EPS && box.min[1] < window.head - EPS && box.max[1] > window.sill + EPS;
    expect(panel.some(overlapsWindow)).toBe(false);
  });

  it('caps the four parapets with a coping and carries the frame up to the roof', () => {
    const roof = roofBoxes(undefined, DESIGNS.a.roof);
    expect(roof.filter((b) => b.id.startsWith('roof:coping:'))).toHaveLength(4);
    expect(ROOF_FRONT.front.map((piece) => piece.id)).toEqual(expect.arrayContaining(['topBand', 'pier']));
  });

  it('renders the overhanging slab\'s outer edges, and leaves the ground slab plain', () => {
    const slabs = Object.fromEntries(house.levels.map(({ spec, model }) => [spec.id, model.slabs]));
    expect(slabs.first.some((slab) => slab.faces?.pz === 'beige')).toBe(true);
    expect(slabs.ground.every((slab) => !slab.faces)).toBe(true);
  });

  it('sets each coping proud of its parapet by the overhang on both faces', () => {
    const roof = roofBoxes(undefined, DESIGNS.a.roof);
    const byId = (id) => roof.find((b) => b.id === id);
    const [parapet, coping] = [byId('roof:parapet:south'), byId('roof:coping:south')];
    expect(coping.min[2]).toBeCloseTo(parapet.min[2] - ROOF.copingOverhang);
    expect(coping.max[2]).toBeCloseTo(parapet.max[2] + ROOF.copingOverhang);
    expect(coping.min[1]).toBeCloseTo(parapet.max[1]);
  });
});

describe('the west side, on the house\'s own yard', () => {
  const house = buildHouse({ cutaway: false, design: 'a' });
  const west = (level) => level.model.facadeDressing.filter((entry) => entry.wall === 'west');

  it('frames every west window with a lighter panel that leaves the glass clear', () => {
    for (const level of house.levels) {
      const windows = level.spec.walls.find((w) => w.id === 'west').openings;
      const panels = west(level).filter((e) => e.piece.id.startsWith('westPanel'));
      expect(panels).toHaveLength(windows.length);
      for (const opening of windows) {
        const covers = (b) => b.min[2] < opening.to - EPS && b.max[2] > opening.from + EPS && b.min[1] < opening.head - EPS && b.max[1] > opening.sill + EPS;
        expect(panels.flatMap((e) => e.boxes).some(covers), opening.id).toBe(false);
      }
    }
  });

  it('keeps the planting under the living room window below its sill', () => {
    const ground = house.levels.find((l) => l.spec.id === 'ground');
    const sill = ground.spec.walls.find((w) => w.id === 'west').openings.find((o) => o.id === 'Win4').sill;
    const plants = west(ground).find((e) => e.piece.id === 'westPlanterPlants').boxes;
    for (const box of plants) expect(box.max[1]).toBeLessThan(sill);
  });

  it('hangs slats with a light at both ends of the upper west face', () => {
    const first = house.levels.find((l) => l.spec.id === 'first');
    const ids = west(first).map((e) => e.piece.id);
    expect(ids).toEqual(expect.arrayContaining(['westSlatsBack', 'westLightBack', 'westSlatsFront', 'westLightFront']));
  });
});
