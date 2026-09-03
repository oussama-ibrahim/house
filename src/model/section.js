// Section cut: which exterior walls face the camera and should drop to the cutaway height.
import { FOOTPRINT } from '../spec/global.js';
import { outwardNormal } from './walls.js';

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/**
 * Ids of the exterior walls whose outward side faces the camera, judged from the level's centre.
 * `offset` is the level group's world position; `cameraPosition` is in world coordinates.
 */
export function nearExteriorWalls(spec, offset, cameraPosition) {
  const centre = [offset[0] + FOOTPRINT / 2, offset[1], offset[2] + FOOTPRINT / 2];
  const toCamera = cameraPosition.map((value, i) => value - centre[i]);
  return spec.walls.filter((wall) => wall.exterior && dot(outwardNormal(wall), toCamera) > 0).map((wall) => wall.id);
}
