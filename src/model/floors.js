import { FLOOR_FINISH_THICKNESS, SLAB_THICKNESS } from '../spec/global.js';
import { roomRects } from '../spec/helpers.js';
import { boxFromRect, planArea } from './box.js';
import { withFacadeFinish } from './walls.js';

/**
 * Slab boxes hang below the finished floor, y −0.28 to 0. With `spec.slabEdge`, the edges on the
 * level's outer faces take that finish, so the slab reads as part of the walls above it.
 */
export function slabBoxes(spec) {
  return spec.slabs.map((slab, i) => {
    const box = boxFromRect(`${spec.id}:slab${i + 1}`, slab.x, [-SLAB_THICKNESS, 0], slab.z, 'structure');
    return spec.slabEdge ? withFacadeFinish(box, spec.size, spec.slabEdge) : box;
  });
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
