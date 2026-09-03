// Check 1: gross area per level and net room areas.
import { CHECKS, GROSS_AREA } from '../spec/global.js';
import { roomArea } from '../model/floors.js';
import { result } from './result.js';

export function checkAreas(house) {
  const failures = [];
  const details = [];
  for (const { spec } of house.levels) {
    const net = spec.rooms.reduce((sum, room) => sum + roomArea(room), 0);
    details.push(`${spec.name}: gross ${GROSS_AREA.toFixed(2)} m², net ${net.toFixed(3)} m² (table ${spec.netArea.toFixed(1)})`);
    if (Math.abs(net - spec.netArea) > CHECKS.netAreaTolerance) {
      failures.push(`${spec.name}: net ${net.toFixed(3)} is more than ${CHECKS.netAreaTolerance} from the table's ${spec.netArea}`);
    }
    for (const room of spec.rooms) {
      const area = roomArea(room);
      if (Math.abs(area - room.tableArea) > CHECKS.roomAreaTolerance) {
        failures.push(`${spec.name} / ${room.name}: ${area.toFixed(3)} m² does not round to the table's ${room.tableArea}`);
      }
    }
  }
  return result(1, 'Areas', failures, details);
}
