import { FLOOR_FINISH_THICKNESS, SLAB_THICKNESS } from '../spec/global.js';
import { roomRects } from '../spec/helpers.js';
import { boxFromRect, planArea } from './box.js';

/** Slab boxes hang below the finished floor, y −0.28 to 0. */
export function slabBoxes(spec) {
  return spec.slabs.map((slab, i) => boxFromRect(`${spec.id}:slab${i + 1}`, slab.x, [-SLAB_THICKNESS, 0], slab.z, 'structure'));
}

/** One finish patch per rectangle of every room that has a finish; the stair void has none. */
export function floorPatches(spec) {
  return spec.rooms
    .filter((room) => room.finish)
    .flatMap((room) =>
      roomRects(room).map((rect, i) =>
        boxFromRect(`${spec.id}:floor:${room.id}${i ? `#${i + 1}` : ''}`, rect.x, [0, FLOOR_FINISH_THICKNESS], rect.z, room.finish, { room: room.id }),
      ),
    );
}

export function roomArea(room) {
  return roomRects(room).reduce((sum, rect) => sum + planArea(rect), 0);
}
