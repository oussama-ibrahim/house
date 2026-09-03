/**
 * Camera position for an orbit described the way OrbitControls does it: azimuth measured from +Z
 * around Y, polar angle from +Y. The scene and check 9 both use this, so they see the same view.
 */
export function orbitPosition({ azimuth, polar, distance, target }) {
  const [tx, ty, tz] = target;
  return [
    tx + distance * Math.sin(polar) * Math.sin(azimuth),
    ty + distance * Math.cos(polar),
    tz + distance * Math.sin(polar) * Math.cos(azimuth),
  ];
}

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const normalize = (v) => {
  const length = Math.hypot(...v);
  return v.map((x) => x / length);
};

/** Unit vectors of the view: from target toward camera, screen right and screen up. */
export function viewBasis({ azimuth, polar }) {
  const toCamera = [Math.sin(polar) * Math.sin(azimuth), Math.cos(polar), Math.sin(polar) * Math.cos(azimuth)];
  const forward = toCamera.map((v) => -v);
  const right = normalize(cross(forward, [0, 1, 0]));
  const up = cross(right, forward);
  return { toCamera, right, up };
}

/** The eight corners of an axis-aligned box given as { min, max }. */
export function boxCorners({ min, max }) {
  const corners = [];
  for (const x of [min[0], max[0]]) for (const y of [min[1], max[1]]) for (const z of [min[2], max[2]]) corners.push([x, y, z]);
  return corners;
}

/**
 * Smallest orbit distance at which every point projects inside `margin` of the frame, for a
 * perspective camera with vertical `fov` (degrees) and the given aspect, looking at `view.target`
 * from the `view` angles. Exact: each point's depth from the camera is the distance minus its
 * offset toward the camera along the view axis.
 */
export function fitDistance(view, points, { fov, aspect, margin = 0.9, marginX = margin }) {
  const { toCamera, right, up } = viewBasis(view);
  const tanVertical = Math.tan((fov / 2) * (Math.PI / 180));
  const tanHorizontal = tanVertical * aspect;
  let distance = 0;
  for (const point of points) {
    const relative = point.map((v, i) => v - view.target[i]);
    const towardCamera = dot(relative, toCamera);
    const vertical = Math.abs(dot(relative, up));
    const lateral = Math.abs(dot(relative, right));
    distance = Math.max(distance, towardCamera + vertical / (margin * tanVertical), towardCamera + lateral / (marginX * tanHorizontal));
  }
  return distance;
}

/** Normalised device coordinates (−1..1) of a point for the given orbit view and lens. */
export function projectPoint(view, point, { fov, aspect }) {
  const { toCamera, right, up } = viewBasis(view);
  const camera = orbitPosition(view);
  const relative = point.map((v, i) => v - camera[i]);
  const depth = -dot(relative, toCamera);
  const tanVertical = Math.tan((fov / 2) * (Math.PI / 180));
  return [dot(relative, right) / (depth * tanVertical * aspect), dot(relative, up) / (depth * tanVertical)];
}

/**
 * Target and distance that frame `points` from the given angles. The target starts at the centre
 * of the points and is then nudged so the projected picture is centred in the frame: from a raised
 * camera the near half of a scene projects lower than the far half, and centring on the picture
 * rather than on the 3D box removes the empty strip that leaves.
 */
export function fitCamera(angles, points, { fov, aspect, margin = 0.9, marginX = margin, passes = 4 }) {
  const { right, up } = viewBasis(angles);
  const tanVertical = Math.tan((fov / 2) * (Math.PI / 180));
  let target = [0, 1, 2].map((i) => (Math.min(...points.map((p) => p[i])) + Math.max(...points.map((p) => p[i]))) / 2);
  let distance = fitDistance({ ...angles, target }, points, { fov, aspect, margin, marginX });
  for (let pass = 0; pass < passes; pass++) {
    const view = { ...angles, target, distance };
    const projected = points.map((point) => projectPoint(view, point, { fov, aspect }));
    const centreX = (Math.min(...projected.map((p) => p[0])) + Math.max(...projected.map((p) => p[0]))) / 2;
    const centreY = (Math.min(...projected.map((p) => p[1])) + Math.max(...projected.map((p) => p[1]))) / 2;
    if (Math.abs(centreX) < 1e-4 && Math.abs(centreY) < 1e-4) break;
    // A frame offset of c at the target's depth is c × distance × tan(half fov) metres.
    const shiftX = centreX * distance * tanVertical * aspect;
    const shiftY = centreY * distance * tanVertical;
    target = target.map((v, i) => v + right[i] * shiftX + up[i] * shiftY);
    distance = fitDistance({ ...angles, target }, points, { fov, aspect, margin, marginX });
  }
  return { target, distance };
}
