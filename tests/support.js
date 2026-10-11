// Lookups shared by the test suites: level specs list their walls, and walls their openings, by id.

export function wallOf(spec, id) {
  const wall = spec.walls.find((candidate) => candidate.id === id);
  if (!wall) throw new Error(`${spec.id} has no wall ${id}`);
  return wall;
}

export function openingOf(spec, wallId, id) {
  const opening = wallOf(spec, wallId).openings.find((candidate) => candidate.id === id);
  if (!opening) throw new Error(`${spec.id} wall ${wallId} has no opening ${id}`);
  return opening;
}
