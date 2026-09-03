# 3D house model — build spec v3

Two-storey house, 6.00 × 6.00 m per level, 36.00 m² gross each. This document is generated from the model's spec data (`npm run spec-doc`); it supersedes v2.1.

**Site constraint.** The east wall stands against the neighbouring house (on the right, seen from the street). It carries no windows on the ground level; the first level may have them. The stair runs along it.

## Part 1 — Prompt to give your dev agent

> Build an interactive 3D model of a small two-storey house using Three.js (r150+, ES modules, `OrbitControls`).
>
> Render into a container div that fills the parent width, height 480 px. Transparent renderer background (`alpha: true`), with a `ShadowMaterial` plane at y = −0.30 to catch shadows. Lighting: `HemisphereLight` (sky `#ffffff`, ground `#9d978c`, intensity 0.8) and one `DirectionalLight` (`#fff2e0`, intensity 0.8) at (10, 16, 8), shadows on, 1024 map, orthographic shadow camera bounds ±14.
>
> Model the two levels as two groups placed side by side, ground level to the west, first level to the east, so both interiors are visible at once. No ceilings.
>
> Every wall, slab, tread and furniture piece is a `BoxGeometry` mesh with `MeshLambertMaterial`. No CSG. Build openings by splitting each wall into segments: a wall carries a list of openings, so write a generic splitter that walks the wall's length and emits a pier between each pair of openings, plus a sill block below and a lintel block above each opening. An opening may sit flush against the end of its wall; the splitter must emit a zero-length pier without error. A window whose head is the wall top has no lintel: that is how the glazed kitchen partition is built. Put a thin translucent box in each window opening as glazing.
>
> View modes: **section** (default; exterior walls facing the camera render at 1.20 m, the rest full height with glazing), **cutaway** (every wall at 1.20 m, glazing and handrail hidden) and **full** (2.60 m walls, glazing and handrail). Buttons for both levels / ground only / first only / reset view, plus a lifted flat roof and a label layer as toggles.
>
> All dimensions are metres. Coordinate system per level: X east, Z south, Y up, origin at the north-west corner of the exterior face, y = 0 at the finished floor surface of that level.
>
> Controls: left-drag orbits, scroll zooms (clamp distance 6–42 m), no panning. Default camera azimuth 0.86 rad, polar 0.95 rad, distance 21 m, target (0, 1.1, 0). `touch-action: none` on the canvas, pointer events, handle window resize.

## Part 2 — Global

| Item | Value |
|---|---|
| Exterior footprint | 6.00 × 6.00 m |
| Gross area per level | 36.00 m² |
| Interior envelope | 5.60 × 5.60 m, i.e. x and z from 0.20 to 5.80 |
| Exterior wall thickness | 0.20 m |
| Interior partition thickness | 0.10 m |
| Wall height, floor to underside of slab | 2.60 m |
| Slab + floor build-up | 0.28 m |
| Floor to floor | 2.88 m |
| Cutaway wall height | 1.20 m |

Exterior wall centrelines: north z = 0.10, south z = 5.90, west x = 0.10, east x = 5.90. Finished interior faces are at 0.20 and 5.80. North and south walls run the full footprint; west and east butt against them.

**Y convention.** Per level, y = 0 is the finished floor surface. The slab occupies y −0.28 to 0.00. Walls run y 0.00 to 2.60. Both levels are modelled at the same y, side by side.

**World placement.** Build each level in local coordinates 0–6, then place the ground group at world (-6.75, 0, -3) and the first-floor group at (0.75, 0, -3).

## Part 3 — Staircase

This governs both levels. Build it first.

| Item | Value |
|---|---|
| Strip | x 4.55 – 5.80, clear width 1.25 m |
| Direction | climbs northward, bottom at z = 5.80 |
| Risers | 16 × 0.180 = 2.880 m |
| Treads | 15 × 0.250 = 3.750 m run |
| Flight extent | z 2.05 – 5.80 |
| Tread *n* (n = 1…15) | x 4.55 – 5.80, z from `5.80 − 0.25n` to `5.80 − 0.25(n−1)`, top at y = `0.18n` |
| Top of flight | tread 15 top at y 2.70, z 2.05 – 2.30; riser 16 lands on the upper floor at y 2.88 |

Model each tread as a box from y = `max(0, 0.18n − 0.40)` to `0.18n`: a cast flight one riser plus a 0.22 m waist thick, so the space under the upper treads is free. Only tread 15 rises above the 2.60 m wall height, topping out at 2.70 inside the slab zone; do not clip it.

**Store under the stair.** The wedge under the upper treads, x 4.55 – 5.80, z 2.05 – 3.80, is a cupboard reached from the living room through D9 in P3. Its soffit runs from 2.30 m at the top end down to 1.20 m at z 3.80; the door head must clear the soffit over the door's whole width.

**Headroom.** The underside of the upper slab is at 2.60. A tread needs 2.05 m clear, so only treads with a top at or below 0.55 m may sit under a slab. The void covers the entire flight, so no tread is under a slab.

**Arrival.** Riser 16 lands at z = 2.05, stepping north onto the landing at x 4.55 – 5.80, z 0.20 – 2.05. The whole north edge of the void is the arrival opening; no railing there. The flight is enclosed by the east wall on one side and a full-height partition on the other.

### Handrail

| Item | Value |
|---|---|
| Wall | east wall, centreline x 5.72 (0.05 off the face) |
| Section | 0.05 × 0.05 |
| Extent | z 5.55 to z 2.30 |
| Height | centreline 0.90 above the nosing line: `y = 0.72 × (5.80 − z) + 1.08` |
| Box | length 4.005 m, centre (5.72, 2.43, 3.92), `rotation.x = +0.6240 rad`, north end high |

Check: at z 5.80 the rail is at 1.08, 0.90 above nosing 1; at z 2.30 it is at 3.60. The handrail is exempt from check 7 and is hidden whenever its wall is cut.

## Part 4 — Ground level

### Rooms (interior faces)

| Room | Extent | Finish | Net m² |
|---|---|---|---|
| Kitchen | x 0.20 – 3.40, z 0.20 – 1.95 | marble | 5.60 (table 5.6) |
| Bathroom + laundry | x 3.50 – 5.80, z 0.20 – 1.95 | tile | 4.02 (table 4.0) |
| Living / dining | x 0.20 – 4.45, z 2.05 – 5.80 | marble | 15.94 (table 15.9) |
| Stair | x 4.55 – 5.80, z 2.05 – 5.80 | tile | 4.69 (table 4.7) |

Gross 36.00 m² to the exterior face; net 30.25 m² (table 30.2).

### Partitions (thickness 0.10, height 2.60, clipped to the interior envelope)

| Ref | Centreline | Extent |
|---|---|---|
| P1 | z = 2.00 | x 0.20 – 5.80 |
| P2 | x = 3.45 | z 0.20 – 1.95 |
| P3 | x = 4.50 | z 2.05 – 5.80 |

### Openings

| Ref | Wall | Position along wall | Width | Sill | Head | Kind |
|---|---|---|---|---|---|---|
| Win2 | north, z 0.10 | x 1.60 – 2.60 | 1.00 | 1.10 | 2.20 | window |
| Win1 | north, z 0.10 | x 4.50 – 5.30 | 0.80 | 1.40 | 2.20 | window |
| D1 | south, z 5.90 | x 0.60 – 1.60 | 1.00 | 0.00 | 2.10 | door |
| Win5 | south, z 5.90 | x 3.10 – 4.30 | 1.20 | 0.90 | 2.20 | window |
| Win6 | south, z 5.90 | x 4.80 – 5.60 | 0.80 | 1.20 | 2.20 | window |
| Win3 | west, x 0.10 | z 0.90 – 1.70 | 0.80 | 1.10 | 2.20 | window |
| Win4 | west, x 0.10 | z 2.30 – 3.30 | 1.00 | 0.90 | 2.20 | window |
| G1 | P1, z 2.00 | x 0.90 – 2.30 | 1.40 | 0.00 | 2.60 | glazed to ceiling |
| D3 | P1, z 2.00 | x 2.40 – 3.30 | 0.90 | 0.00 | 2.05 | opening, no leaf |
| D2 | P1, z 2.00 | x 3.60 – 4.40 | 0.80 | 0.00 | 2.05 | door |
| D9 | P3, x 4.50 | z 2.10 – 2.80 | 0.70 | 0.00 | 1.90 | door |
| D4 | P3, x 4.50 | z 4.80 – 5.80 | 1.00 | 0.00 | 2.20 | opening, no leaf |

Blind walls, no openings: east.

### Clear zones — no furniture may enter these

| Opening | Clear zone |
|---|---|
| D1 | x 0.40 – 1.80, z 4.60 – 5.80 |
| D2 | x 3.50 – 4.50, z 1.45 – 2.65 |
| D3 | x 2.30 – 3.40, z 1.45 – 2.65 |
| D4 | x 3.90 – 4.55, z 4.80 – 5.80 |
| D9 | x 3.80 – 4.55, z 2.00 – 2.90 |

### Furniture (position = centre, footprint w × d, height from floor)

A piece may touch a wall face only where the `Touches` column says so. Everywhere else the minimum gap to any wall face is 0.05 m.

| Piece | w × d × h | Centre (x, z) | Touches | Extent |
|---|---|---|---|---|
| Sofa | 0.85 × 2.10 × 0.80 | 0.63, 3.50 | west | x 0.20 – 1.05, z 2.45 – 4.55 |
| Coffee table | 0.90 × 0.55 × 0.38 | 1.80, 3.95 | — | x 1.35 – 2.25, z 3.67 – 4.22 |
| TV unit | 0.40 × 1.30 × 0.50 | 4.25, 3.60 | P3 | x 4.05 – 4.45, z 2.95 – 4.25 |
| Dining table | 5 boxes | 2.80, 3.10 | — | x 2.15 – 3.45, z 2.70 – 3.50 |
| Chair W | 2 boxes | 2.10, 3.10 | — | x 1.88 – 2.33, z 2.88 – 3.33 |
| Chair E | 2 boxes | 3.50, 3.10 | — | x 3.27 – 3.73, z 2.88 – 3.33 |
| Chair S | 2 boxes | 2.80, 3.75 | — | x 2.58 – 3.02, z 3.52 – 3.98 |
| Kitchen base run | 2.35 × 0.60 × 0.90 | 1.38, 0.50 | north, west | x 0.20 – 2.55, z 0.20 – 0.80 |
| Kitchen return run | 0.60 × 1.10 × 0.90 | 0.50, 1.35 | west | x 0.20 – 0.80, z 0.80 – 1.90 |
| Wall cabinets | 0.80 × 0.35 × 0.60, from y 1.50 | 1.20, 0.38 | north | x 0.80 – 1.60, z 0.20 – 0.55 |
| Fridge | 0.60 × 0.65 × 1.80 | 2.95, 0.57 | — | x 2.65 – 3.25, z 0.25 – 0.90 |
| Shower tray | 0.90 × 0.90 × 0.08 | 3.95, 0.65 | north, P2 | x 3.50 – 4.40, z 0.20 – 1.10 |
| Shower screen, east panel | 0.02 × 0.90 × 1.90, from y 0.08 | 4.39, 0.65 | north | x 4.38 – 4.40, z 0.20 – 1.10 |
| Shower screen, south panel | 0.40 × 0.02 × 1.90, from y 0.08 | 4.20, 1.09 | — | x 4.00 – 4.40, z 1.08 – 1.10 |
| Basin | 0.60 × 0.40 × 0.85 | 4.85, 0.40 | north | x 4.55 – 5.15, z 0.20 – 0.60 |
| WC | 0.42 × 0.65 × 0.42 | 5.54, 0.93 | — | x 5.33 – 5.75, z 0.60 – 1.25 |
| Washing machine | 0.60 × 0.60 × 0.85 | 5.45, 1.60 | — | x 5.15 – 5.75, z 1.30 – 1.90 |

### Dressing (rendered only, never measured)

| Piece | w × d × h | Centre (x, z) | Touches | Extent |
|---|---|---|---|---|
| Worktop | 2 boxes | 1.38, 0.50 | — | x 0.20 – 2.55, z 0.20 – 1.90 |
| Hob | 0.58 × 0.50 × 0.01, from y 0.94 | 1.20, 0.50 | — | x 0.91 – 1.49, z 0.25 – 0.75 |
| Sink | 2 boxes | 2.10, 0.50 | — | x 1.85 – 2.35, z 0.27 – 0.70 |
| TV | 0.04 × 1.10 × 0.62, from y 0.50 | 4.41, 3.60 | — | x 4.39 – 4.43, z 3.05 – 4.15 |
| Cistern | 0.15 × 0.42 × 0.40, from y 0.42 | 5.67, 0.93 | — | x 5.60 – 5.75, z 0.71 – 1.14 |
| Front door leaf, open | 0.05 × 1.00 × 2.10 | 0.63, 5.30 | — | x 0.60 – 0.65, z 4.80 – 5.80 |
| Bathroom door leaf, open | 0.05 × 0.80 × 2.05 | 3.63, 1.55 | — | x 3.60 – 3.65, z 1.15 – 1.95 |
| Store door leaf, open | 0.70 × 0.05 × 1.90 | 4.10, 2.13 | — | x 3.75 – 4.45, z 2.10 – 2.15 |
| Store shelving | 5 boxes | 5.37, 2.70 | — | x 5.35 – 5.75, z 2.10 – 3.30 |
| Kitchen sliding glass leaf, open | 5 boxes | 1.85, 1.88 | — | x 1.40 – 2.30, z 1.86 – 1.90 |

### Clearances (check 10)

| In front of | From | Over | Minimum | Expected |
|---|---|---|---|---|
| Shower entry | z = 1.10, southward | x 3.50 – 4.00 | 0.60 | 0.85 |
| WC, ground bathroom | x = 5.33, westward | z 0.60 – 1.25 | 0.60 | 0.93 |

## Part 5 — First level

### Rooms (interior faces)

| Room | Extent | Finish | Net m² |
|---|---|---|---|
| Hall | x 3.55 – 5.80, z 0.20 – 2.05, plus x 3.55 – 4.45, z 2.05 – 2.95 | marble | 4.97 (table 5.0) |
| Stair void | x 4.55 – 5.80, z 2.05 – 5.80 | — | 4.69 (table 4.7) |
| Bedroom 2 | x 0.20 – 3.45, z 0.20 – 2.95 | wood | 8.94 (table 8.9) |
| Bedroom 1 | x 0.20 – 4.45, z 3.05 – 5.80 | wood | 11.69 (table 11.7) |

Gross 36.00 m² to the exterior face; net 30.29 m² (table 30.3).

### Partitions (thickness 0.10, height 2.60, clipped to the interior envelope)

| Ref | Centreline | Extent |
|---|---|---|
| P4 | x = 4.50 | z 2.05 – 5.80 |
| P5 | x = 3.50 | z 0.20 – 2.95 |
| P7 | z = 3.00 | x 0.20 – 4.45 |

### Openings

| Ref | Wall | Position along wall | Width | Sill | Head | Kind |
|---|---|---|---|---|---|---|
| Win7 | north, z 0.10 | x 0.40 – 2.00 | 1.60 | 0.90 | 2.20 | window |
| Win9 | north, z 0.10 | x 3.90 – 5.30 | 1.40 | 1.20 | 2.20 | window |
| Win12 | south, z 5.90 | x 0.50 – 1.90 | 1.40 | 0.90 | 2.20 | window |
| Win11 | south, z 5.90 | x 3.10 – 4.10 | 1.00 | 0.90 | 2.20 | window |
| Win8 | west, x 0.10 | z 0.80 – 2.00 | 1.20 | 0.90 | 2.20 | window |
| Win14 | west, x 0.10 | z 3.50 – 4.70 | 1.20 | 0.90 | 2.20 | window |
| Win13 | east, x 5.90 | z 0.60 – 1.60 | 1.00 | 1.20 | 2.20 | window |
| D6 | P5, x 3.50 | z 0.60 – 1.40 | 0.80 | 0.00 | 2.05 | door |
| D7 | P7, z 3.00 | x 3.60 – 4.40 | 0.80 | 0.00 | 2.05 | door |

Every exterior wall carries at least one opening.

### Clear zones — no furniture may enter these

| Opening | Clear zone |
|---|---|
| D6 | x 2.85 – 4.15, z 0.50 – 1.50 |
| D7 | x 3.50 – 4.50, z 2.35 – 3.65 |

### Furniture (position = centre, footprint w × d, height from floor)

A piece may touch a wall face only where the `Touches` column says so. Everywhere else the minimum gap to any wall face is 0.05 m.

| Piece | w × d × h | Centre (x, z) | Touches | Extent |
|---|---|---|---|---|
| Double bed | 1.60 × 2.00 × 0.50 | 1.85, 4.17 | — | x 1.05 – 2.65, z 3.17 – 5.17 |
| Headboard, bedroom 1 | 1.70 × 0.12 × 0.50 | 1.85, 3.11 | P7 | x 1.00 – 2.70, z 3.05 – 3.17 |
| Nightstand, bedroom 1 west | 0.40 × 0.40 × 0.45 | 0.80, 3.30 | — | x 0.60 – 1.00, z 3.10 – 3.50 |
| Nightstand, bedroom 1 east | 0.40 × 0.40 × 0.45 | 2.90, 3.30 | — | x 2.70 – 3.10, z 3.10 – 3.50 |
| Wardrobe, bedroom 1 | 0.60 × 1.20 × 2.10 | 4.15, 4.80 | P4 | x 3.85 – 4.45, z 4.20 – 5.40 |
| Bed, bedroom 2 | 1.40 × 1.90 × 0.50 | 1.00, 1.88 | — | x 0.30 – 1.70, z 0.93 – 2.83 |
| Headboard, bedroom 2 | 1.50 × 0.12 × 0.50 | 1.00, 2.89 | P7 | x 0.25 – 1.75, z 2.83 – 2.95 |
| Nightstand, bedroom 2 | 0.40 × 0.40 × 0.45 | 1.95, 2.70 | — | x 1.75 – 2.15, z 2.50 – 2.90 |
| Wardrobe, bedroom 2 | 0.60 × 1.20 × 2.10 | 3.15, 2.30 | P5 | x 2.85 – 3.45, z 1.70 – 2.90 |
| Desk, bedroom 2 | 0.90 × 0.55 × 0.74 | 2.40, 0.47 | north | x 1.95 – 2.85, z 0.20 – 0.75 |

### Dressing (rendered only, never measured)

| Piece | w × d × h | Centre (x, z) | Touches | Extent |
|---|---|---|---|---|
| Pillows | 2 boxes | 1.45, 3.45 | — | x 1.15 – 2.55, z 3.25 – 3.65 |
| Throw | 1.60 × 0.70 × 0.04, from y 0.50 | 1.85, 4.75 | — | x 1.05 – 2.65, z 4.40 – 5.10 |
| Pillow | 0.60 × 0.40 × 0.12, from y 0.50 | 1.00, 2.55 | — | x 0.70 – 1.30, z 2.35 – 2.75 |
| Throw | 1.40 × 0.60 × 0.04, from y 0.50 | 1.00, 1.35 | — | x 0.30 – 1.70, z 1.05 – 1.65 |
| Monitor | 2 boxes | 2.40, 0.30 | — | x 2.15 – 2.65, z 0.28 – 0.42 |
| Bedroom 2 door leaf, open | 0.80 × 0.05 × 2.05 | 3.05, 1.43 | — | x 2.65 – 3.45, z 1.40 – 1.45 |
| Bedroom 1 door leaf, open | 0.05 × 0.80 × 2.05 | 3.63, 3.45 | — | x 3.60 – 3.65, z 3.05 – 3.85 |

### Clearances (check 10)

| In front of | From | Over | Minimum | Expected |
|---|---|---|---|---|
| Wardrobe, bedroom 1 (doors face west) | x = 3.85, westward | z 4.20 – 5.40 | 0.60 | 1.20 |
| Wardrobe, bedroom 2 (doors face west) | x = 2.85, westward | z 1.70 – 2.90 | 0.60 | 0.70 |

## Part 6 — Materials

| Element | Hex |
|---|---|
| Walls | `#F4F2EE` |
| Slab, structure, stair, worktops | `#C4BFB6` |
| Wood floor (bedrooms) | `#CBA97D` |
| Tiled floor (wet rooms, stair) | `#D6D3CC` |
| Marble-look tile (living, kitchen, landing, corridor) | `#EDEBE6` |
| Joinery, wardrobes, tables, doors, handrail | `#C49B6C` |
| Upholstery | `#D9CEBE` |
| Bedding | `#F2EFE9` |
| Sanitary fittings, kitchen cabinets | `#FAF9F7` |
| Appliances (fridge, hob, sink, TV) | `#262626` |
| Glazing, shower screens | `#9FC3D8`, opacity 0.35 |
| Window and screen frames | `#1E1E1E` |

Fixed scene colours. Do not swap them for light/dark theme variables.

## Part 7 — Acceptance checks

Run these as assertions, not as a reading exercise. `npm test` runs all of them; `npm run check` prints the report.

1. Gross area per level = 36.00 m². Net areas match the room tables within 0.1 m².
2. For every tread *n*, if any slab box overlaps that tread's x–z extent, then `2.60 − 0.18n ≥ 2.05`. With the void over the whole flight this passes vacuously; assert it anyway.
3. The ground-level stair room and the first-level void coincide, the flight lies within the void, and the landing sits over a single ground-level room (allowing for the partition along its edge).
4. The stair strip is 1.25 m clear between wall faces on both flanks, and no tread box extends outside it.
5. No furniture bounding box intersects any wall box. A furniture box may touch a wall face only where its `Touches` column says so; elsewhere the minimum gap is 0.05 m.
6. No furniture bounding box intersects any clear zone.
7. No opaque furniture box intersects the vertical prism of any window opening: the opening span × sill-to-head height × 0.35 m into the room. Transparent elements (glazing, shower screens, the handrail) are exempt.
8. Every partition is clipped to 0.20 ≤ x, z ≤ 5.80, so no partition end face is coplanar with a facade.
9. Visibility. Sample a 5 × 5 grid on each target's top face and cast a ray to the default camera in cutaway mode (every wall at 1.20 m). Occluders are wall, slab and tread boxes only. Assert 60 % or more unobstructed. Expected: kitchen base run 80 %, fridge 100 %, sofa 100 %, double bed 100 %, bed, bedroom 2 80 %, desk, bedroom 2 100 %.
10. In front of each wardrobe, WC and shower entry, over the full width, the clear distance to the nearest furniture or wall is at least 0.60 m (expected values in the clearance tables).
11. The handrail centreline is 0.90 m above every tread nosing, and its underside clears every tread.

