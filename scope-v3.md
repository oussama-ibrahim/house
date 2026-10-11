# 3D house model — build spec v3, 6.15 × 7.20 house, first level 6.15 × 8.20

Two-storey house: ground level 6.15 × 7.20 m (44.28 m² gross), first level 6.15 × 8.20 m (50.43 m² gross). This document is generated from the model's spec data (`npm run spec-doc`); it supersedes v2.1.

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
| Footprint, ground level | 6.15 × 7.20 m, 44.28 m² gross; interior x 0.20–5.95, z 0.20–7.00 |
| Footprint, first level | 6.15 × 8.20 m, 50.43 m² gross; interior x 0.20–5.95, z 0.20–8.00 |
| Exterior wall thickness | 0.20 m |
| Interior partition thickness | 0.10 m |
| Wall height, floor to underside of slab | 2.60 m |
| Slab + floor build-up | 0.28 m |
| Floor to floor | 2.88 m |
| Cutaway wall height | 1.20 m |

Exterior wall centrelines sit 0.10 in from each facade; finished interior faces 0.20 in. North and south walls run the full width; west and east butt against them.

**Overhang.** The first level is 1.00 m deeper than the ground level: its slab cantilevers that far over the street beyond the ground level's south face. Both levels keep their origin at the shared north-west corner, so the stair void and the arrival use the same z coordinates on both.

### Window family

Every window is one of these types; a level chooses only where each starts along its wall. Heads share one line, a 0.20 m lintel under the slab, except the stair slot, which runs to the wall top.

| Type | Width | Sill | Head | Used for |
|---|---|---|---|---|
| room | 1.80 | 0.90 | 2.40 | living room and bedrooms, sofa and bed height beneath |
| high | 0.80 | 1.20 | 2.40 | WC, shower room, landing |
| kitchen | 2.10 | 1.10 | 2.40 | over the worktop |
| roomNarrow | 1.50 | 0.90 | 2.40 | the living room's street window, between the corner and the front door |
| slot | 0.45 | 0.90 | 2.60 | the stair slot on the ground level, fixed laminated glass over the landing |

**Y convention.** Per level, y = 0 is the finished floor surface. The slab occupies y −0.28 to 0.00. Walls run y 0.00 to 2.60. Both levels are modelled at the same y, side by side.

**World placement.** Build each level in local coordinates from its north-west corner, then place the ground group at world (-6.9, 0, -3.6) and the first-floor group at (0.75, 0, -4.1).

## Part 3 — Staircase

This governs both levels. Build it first. A quarter-turn stair fitted to the first-floor slab as built: its opening is 3.00 m long and ends 1.80 m from the first level's street wall. A starter leg along the front wall and a low landing in the south-east corner sit under the slab; the main flight climbs north against the party wall and fills the opening exactly.

| Item | Value |
|---|---|
| Risers | 16 × 0.180 = 2.880 m: 3 up to the landing, 13 on the main flight |
| Starter leg | climbs eastward from x 4.16 to 4.70, z 6.20 – 7.00; 2 treads of 0.270 m, tops at y = `0.18n`, approached head-on from the living room |
| Landing | x 4.70 – 5.95, z 6.20 – 7.00, top at y 0.54, a plate on a steel frame and four posts |
| Main flight strip | x 4.70 – 5.95, clear width 1.25 m |
| Main flight | climbs northward from the landing, bottom at z = 6.20; 12 × 0.250 = 3.000 m run, extent z 3.20 – 6.20 |
| Main tread *n* (n = 1…12) | x 4.70 – 5.95, z from `6.20 − 0.25n` to `6.20 − 0.25(n−1)`, top at y = `0.54 + 0.18n` |
| Top of flight | main tread 12 top at y 2.70, z 3.20 – 3.45; riser 16 lands on the upper floor at y 2.88 |

**Steel stair.** Every tread is a 0.04 m plate in marble with open risers, carried on 0.20 × 0.02 steel stringers whose top edge runs 0.10 m under the nosing line: two under the main flight at x 4.71 and 5.94, from the landing to the slab edge, and two under the starter leg at z 6.21 and 6.99. The landing is a plate at y 0.54 on a 0.20 m frame carried by four 0.03 m posts. Only the top main tread rises above the 2.60 m wall height, topping out at 2.70 inside the slab zone; do not clip it.

**Under the stair.** Open to the living room under both legs and the landing: no wall along the main flight's west side, only the guard. The TV unit stands against the party wall under the high end of the flight.

**Headroom.** The underside of the upper slab is at 2.60. A step needs 2.05 m clear, so only steps with a top at or below 0.55 m may sit under a slab: the starter leg and the landing, at 0.54, do, under bedroom 1's floor. The void is the slab opening and covers the whole main flight.

**Arrival.** Riser 16 lands at z = 3.20, stepping north onto the landing at x 4.70 – 5.95, z 1.95 – 3.20, kept clear one flight width deep. The whole north edge of the void is the arrival opening; no railing there. The main flight has the east wall on one side and, on the west, a guard of 0.03 m posts on every third tread under a 0.04 m rail at handrail height; the starter leg carries the same guard along its open north side, and the two rails meet at a newel on the landing's corner.

### Handrail

| Item | Value |
|---|---|
| Wall | east wall, centreline x 5.88 (0.05 off the face) |
| Section | 0.05 × 0.05 |
| Extent | z 5.95 to z 3.45, the main flight only |
| Height | centreline 0.90 above the nosing line: `y = 0.72 × (6.20 − z) + 1.62` |
| Box | length 3.081 m, centre (5.88, 2.70, 4.70), `rotation.x = +0.6240 rad`, north end high |

Check: at z 6.20 the rail is at 1.62, 0.90 above nosing 1; at z 3.45 it is at 3.60. The handrail is exempt from check 7 and is hidden whenever its wall is cut.

## Part 4 — Ground level

### Rooms (interior faces)

| Room | Extent | Finish | Net m² |
|---|---|---|---|
| WC + laundry | x 0.20 – 2.95, z 0.20 – 1.85 | tile | 4.54 (table 4.5) |
| Kitchen | x 3.20 – 5.95, z 0.20 – 2.85, plus x 3.20 – 4.70, z 2.85 – 2.90 and x 4.70 – 5.95, z 2.85 – 3.10 | marble | 7.67 (table 7.7) |
| Living / dining | x 0.20 – 4.60, z 3.00 – 7.00, plus x 0.20 – 2.95, z 1.95 – 3.00 and x 4.60 – 4.70, z 3.20 – 6.20 | marble | 20.79 (table 20.8) |
| Stair | x 4.70 – 5.95, z 3.20 – 7.00 | marble | 4.75 (table 4.8) |

Footprint 6.15 × 7.20 m, gross 44.28 m² to the exterior face; net 37.75 m² (table 37.8).

### Partitions (thickness 0.10 unless noted, height 2.60, clipped to the interior envelope)

| Ref | Centreline | Extent |
|---|---|---|
| P1 | z = 1.90 | x 0.20 – 2.95 |
| P8 | x = 3.08 | z 0.20 – 1.95, 0.25 thick |
| P8b | x = 3.18 | z 1.95 – 2.75, 0.05 thick |
| P10 | z = 2.95 | x 3.20 – 4.70 |
| P6 | z = 3.15 | x 4.70 – 5.95 |
| P3 | x = 4.65 | z 3.00 – 3.20 |

### Columns (structural, floor to slab, same position on both levels)

| Ref | Extent | Section |
|---|---|---|
| C1 | x 2.95 – 3.20, z 2.75 – 3.00 | 0.25 × 0.25 |
| C2 | x 2.95 – 3.20, z 6.95 – 7.20 | 0.25 × 0.25 |

### Openings

| Ref | Wall | Position along wall | Width | Sill | Head | Kind |
|---|---|---|---|---|---|---|
| Win2 | north, z 0.10 | x 3.60 – 5.70 | 2.10 | 1.10 | 2.40 | window |
| Win5 | south, z 7.10 | x 0.30 – 1.80 | 1.50 | 0.90 | 2.40 | window |
| D1 | south, z 7.10 | x 1.95 – 2.95 | 1.00 | 0.00 | 2.10 | door |
| C2 | south, z 7.10 | x 2.95 – 3.20 | 0.25 | — | — | structural column in the wall line |
| Win6 | south, z 7.10 | x 5.10 – 5.55 | 0.45 | 0.90 | 2.60 | glazed to ceiling |
| Win3 | west, x 0.10 | z 1.00 – 1.80 | 0.80 | 1.20 | 2.40 | window |
| Win4 | west, x 0.10 | z 4.70 – 6.50 | 1.80 | 0.90 | 2.40 | window |
| D2 | P1, z 1.90 | x 2.05 – 2.75 | 0.70 | 0.00 | 2.05 | door |
| D3 | P6, z 3.15 | x 4.70 – 5.60 | 0.90 | 0.00 | 2.05 | door |

Blind walls, no openings: east.

### Clear zones — no furniture may enter these

| Opening | Clear zone |
|---|---|
| D1 | x 1.85 – 2.95, z 5.80 – 7.00 |
| D2 | x 1.95 – 2.85, z 1.25 – 2.45 |
| D3 | x 4.70 – 5.60, z 2.30 – 4.00 |
| stairFoot | x 3.20 – 4.16, z 6.20 – 6.95 |

### Furniture (position = centre, footprint w × d, height from floor)

A piece may touch a wall face only where the `Touches` column says so. Everywhere else the minimum gap to any wall face is 0.05 m.

| Piece | w × d × h | Centre (x, z) | Touches | Extent |
|---|---|---|---|---|
| Sofa | 0.85 × 2.10 × 0.80 | 0.63, 4.60 | west | x 0.20 – 1.05, z 3.55 – 5.65 |
| Armchair | 2 boxes | 0.70, 6.15 | — | x 0.30 – 1.10, z 5.75 – 6.55 |
| Sideboard | 1.00 × 0.40 × 0.85 | 1.05, 6.80 | south | x 0.55 – 1.55, z 6.60 – 7.00 |
| TV unit | 0.35 × 1.30 × 0.50 | 5.78, 4.40 | east | x 5.60 – 5.95, z 3.75 – 5.05 |
| Dining table | 5 boxes | 2.43, 4.78 | — | x 1.83 – 3.03, z 4.38 – 5.17 |
| Chair W | 2 boxes | 1.78, 4.78 | — | x 1.55 – 2.00, z 4.55 – 5.00 |
| Chair E | 2 boxes | 3.08, 4.78 | — | x 2.85 – 3.31, z 4.55 – 5.00 |
| Chair N | 2 boxes | 2.43, 4.13 | — | x 2.21 – 2.65, z 3.90 – 4.35 |
| Chair S | 2 boxes | 2.43, 5.42 | — | x 2.21 – 2.65, z 5.20 – 5.65 |
| Kitchen north run | 2.15 × 0.60 × 0.90 | 4.28, 0.50 | north, P8 | x 3.20 – 5.35, z 0.20 – 0.80 |
| Kitchen east run | 0.60 × 1.35 × 0.90 | 5.65, 1.48 | east | x 5.35 – 5.95, z 0.80 – 2.15 |
| Fridge | 0.60 × 0.65 × 1.80 | 3.50, 1.18 | P8 | x 3.20 – 3.80, z 0.85 – 1.50 |
| Wall cabinets | 0.35 × 1.35 × 0.60, from y 1.50 | 5.78, 1.48 | east | x 5.60 – 5.95, z 0.80 – 2.15 |
| Tall cabinet | 0.50 × 0.95 × 2.10 | 3.45, 2.02 | P8, P8b | x 3.20 – 3.70, z 1.55 – 2.50 |
| Washing machine | 0.60 × 0.60 × 0.85 | 0.50, 0.50 | north, west | x 0.20 – 0.80, z 0.20 – 0.80 |
| Hand basin | 0.45 × 0.35 × 0.85 | 1.30, 0.38 | north | x 1.07 – 1.52, z 0.20 – 0.55 |
| WC | 0.65 × 0.42 × 0.42 | 0.53, 1.49 | west | x 0.20 – 0.85, z 1.28 – 1.70 |
| Laundry shelving | 0.35 × 0.80 × 2.10 | 2.77, 0.60 | north, P8 | x 2.60 – 2.95, z 0.20 – 1.00 |
| Hall shoe cabinet and display shelves | 4 boxes | 3.05, 2.35 | P1, P8, P8b, C1 | x 2.95 – 3.15, z 1.95 – 2.75 |

### Dressing (rendered only, never measured)

| Piece | w × d × h | Centre (x, z) | Touches | Extent |
|---|---|---|---|---|
| Worktop | 2 boxes | 4.28, 0.50 | — | x 3.20 – 5.95, z 0.20 – 2.15 |
| Hob | 0.50 × 0.58 × 0.01, from y 0.94 | 5.65, 1.30 | — | x 5.40 – 5.90, z 1.01 – 1.59 |
| Sink | 2 boxes | 4.60, 0.50 | — | x 4.35 – 4.85, z 0.27 – 0.70 |
| TV | 0.04 × 1.10 × 0.62, from y 0.50 | 5.63, 4.40 | — | x 5.61 – 5.65, z 3.85 – 4.95 |
| Floor lamp | 3 boxes | 0.50, 3.25 | — | x 0.33 – 0.68, z 3.08 – 3.42 |
| Cistern | 0.15 × 0.42 × 0.40, from y 0.42 | 0.28, 1.49 | — | x 0.20 – 0.35, z 1.28 – 1.70 |
| Front door leaf, open | 0.05 × 1.00 × 2.10 | 1.98, 6.50 | — | x 1.95 – 2.00, z 6.00 – 7.00 |
| WC door leaf, open | 0.05 × 0.70 × 2.05 | 2.73, 1.50 | — | x 2.70 – 2.75, z 1.15 – 1.85 |
| Decor on the hall shelves | 3 boxes | 3.06, 2.15 | — | x 2.99 – 3.13, z 2.09 – 2.60 |
| Kitchen door leaf, open | 0.05 × 0.90 × 2.05 | 5.63, 2.65 | — | x 5.60 – 5.65, z 2.20 – 3.10 |

### Clearances (check 10)

| In front of | From | Over | Minimum | Expected |
|---|---|---|---|---|
| WC, ground floor | x = 0.85, eastward | z 1.28 – 1.70 | 0.60 | 2.10 |
| Hand basin, ground floor | z = 0.55, southward | x 1.07 – 1.52 | 0.60 | 1.30 |
| Laundry shelving (faces west) | x = 2.60, westward | z 0.20 – 1.00 | 0.60 | 1.07 |
| Tall cabinet, kitchen (doors face east) | x = 3.70, eastward | z 1.55 – 2.50 | 0.60 | 1.65 |

## Part 5 — First level

### Rooms (interior faces)

| Room | Extent | Finish | Net m² |
|---|---|---|---|
| Landing | x 3.65 – 5.95, z 1.70 – 3.20, plus x 3.65 – 4.60, z 3.20 – 4.05 | marble | 4.26 (table 4.3) |
| Shower room | x 3.65 – 5.95, z 0.20 – 1.60 | tile | 3.22 (table 3.2) |
| Stair void | x 4.70 – 5.95, z 3.20 – 6.20 | — | 3.75 (table 3.8) |
| Bedroom 2 | x 0.20 – 2.95, z 0.20 – 4.05, plus x 2.95 – 3.55, z 0.20 – 2.75 and x 2.95 – 3.55, z 3.00 – 4.05 | wood | 12.75 (table 12.7) |
| Bedroom 1 | x 0.20 – 4.60, z 4.15 – 8.00, plus x 4.60 – 5.95, z 6.30 – 8.00 | wood | 19.23 (table 19.2) |

Footprint 6.15 × 8.20 m, gross 50.43 m² to the exterior face; net 43.21 m² (table 43.2).

### Partitions (thickness 0.10 unless noted, height 2.60, clipped to the interior envelope)

| Ref | Centreline | Extent |
|---|---|---|
| P4 | x = 4.65 | z 3.20 – 6.20 |
| P12 | z = 6.25 | x 4.60 – 5.95 |
| P5 | x = 3.60 | z 0.20 – 4.05 |
| P7 | z = 4.10 | x 0.20 – 4.60 |
| P9 | z = 1.65 | x 3.65 – 5.95 |
| N1 | z = 2.88 | x 3.20 – 3.55, 0.25 thick |

### Columns (structural, floor to slab, same position on both levels)

| Ref | Extent | Section |
|---|---|---|
| C1 | x 2.95 – 3.20, z 2.75 – 3.00 | 0.25 × 0.25 |
| C2 | x 2.95 – 3.20, z 6.95 – 7.20 | 0.25 × 0.25 |

### Openings

| Ref | Wall | Position along wall | Width | Sill | Head | Kind |
|---|---|---|---|---|---|---|
| Win9 | north, z 0.10 | x 4.20 – 5.00 | 0.80 | 1.20 | 2.40 | window |
| Win11 | south, z 8.10 | x 0.60 – 2.40 | 1.80 | 0.90 | 2.40 | window |
| Win8 | west, x 0.10 | z 0.50 – 2.30 | 1.80 | 0.90 | 2.40 | window |
| Win14 | west, x 0.10 | z 4.70 – 6.50 | 1.80 | 0.90 | 2.40 | window |
| D13 | east, x 6.05 | z 1.75 – 2.65 | 0.90 | 0.00 | 2.40 | opening, no leaf |
| D6 | P5, x 3.60 | z 3.00 – 3.80 | 0.80 | 0.00 | 2.05 | door |
| D7 | P7, z 4.10 | x 3.75 – 4.55 | 0.80 | 0.00 | 2.05 | door |
| D11 | P9, z 1.65 | x 4.65 – 5.35 | 0.70 | 0.00 | 2.05 | door |

Every exterior wall carries at least one opening.

### Clear zones — no furniture may enter these

| Opening | Clear zone |
|---|---|
| D6 | x 2.95 – 4.25, z 3.00 – 3.90 |
| D7 | x 3.65 – 4.65, z 3.45 – 4.75 |
| D11 | x 4.55 – 5.45, z 1.00 – 2.30 |

### Furniture (position = centre, footprint w × d, height from floor)

A piece may touch a wall face only where the `Touches` column says so. Everywhere else the minimum gap to any wall face is 0.05 m.

| Piece | w × d × h | Centre (x, z) | Touches | Extent |
|---|---|---|---|---|
| Double bed | 1.60 × 2.00 × 0.50 | 1.57, 5.27 | — | x 0.78 – 2.38, z 4.27 – 6.27 |
| Headboard, bedroom 1 | 1.70 × 0.12 × 0.50 | 1.57, 4.21 | P7 | x 0.72 – 2.42, z 4.15 – 4.27 |
| Nightstand, bedroom 1 west | 0.40 × 0.40 × 0.45 | 0.50, 4.40 | — | x 0.30 – 0.70, z 4.20 – 4.60 |
| Nightstand, bedroom 1 east | 0.40 × 0.40 × 0.45 | 2.65, 4.40 | — | x 2.45 – 2.85, z 4.20 – 4.60 |
| Dressing, bedroom 1 | 4 boxes | 4.58, 7.46 | south, east, C2 | x 2.93 – 5.95, z 6.93 – 8.00 |
| Bed, bedroom 2 | 1.40 × 1.90 × 0.50 | 1.00, 2.98 | — | x 0.30 – 1.70, z 2.03 – 3.93 |
| Headboard, bedroom 2 | 1.50 × 0.12 × 0.50 | 1.00, 3.99 | P7 | x 0.25 – 1.75, z 3.93 – 4.05 |
| Nightstand, bedroom 2 | 0.40 × 0.40 × 0.45 | 1.95, 3.80 | — | x 1.75 – 2.15, z 3.60 – 4.00 |
| Dressing, bedroom 2 | 2 boxes | 3.24, 1.48 | north, P5, C1, N1 | x 2.93 – 3.55, z 0.20 – 3.00 |
| Desk, bedroom 2 | 0.90 × 0.55 × 0.74 | 1.85, 0.47 | north | x 1.40 – 2.30, z 0.20 – 0.75 |
| Linen cupboard | 0.90 × 0.40 × 2.10 | 4.10, 1.90 | P9, P5 | x 3.65 – 4.55, z 1.70 – 2.10 |
| Shower tray, upstairs | 0.90 × 0.80 × 0.08 | 4.10, 0.60 | north, P5 | x 3.65 – 4.55, z 0.20 – 1.00 |
| Shower screen, east panel, upstairs | 0.02 × 0.80 × 1.90, from y 0.08 | 4.54, 0.60 | north | x 4.53 – 4.55, z 0.20 – 1.00 |
| Shower screen, south panel, upstairs | 0.40 × 0.02 × 1.90, from y 0.08 | 4.35, 0.99 | — | x 4.15 – 4.55, z 0.98 – 1.00 |
| WC, upstairs | 0.42 × 0.65 × 0.42 | 5.16, 0.53 | north | x 4.95 – 5.37, z 0.20 – 0.85 |
| Basin, upstairs | 0.40 × 0.50 × 0.85 | 5.75, 1.30 | east | x 5.55 – 5.95, z 1.05 – 1.55 |

### Dressing (rendered only, never measured)

| Piece | w × d × h | Centre (x, z) | Touches | Extent |
|---|---|---|---|---|
| Pillows | 2 boxes | 1.18, 4.55 | — | x 0.88 – 2.27, z 4.35 – 4.75 |
| Throw | 1.60 × 0.70 × 0.04, from y 0.50 | 1.57, 5.85 | — | x 0.78 – 2.38, z 5.50 – 6.20 |
| Pillow | 0.60 × 0.40 × 0.12, from y 0.50 | 1.00, 3.65 | — | x 0.70 – 1.30, z 3.45 – 3.85 |
| Throw | 1.40 × 0.60 × 0.04, from y 0.50 | 1.00, 2.45 | — | x 0.30 – 1.70, z 2.15 – 2.75 |
| Monitor | 2 boxes | 1.85, 0.30 | — | x 1.60 – 2.10, z 0.28 – 0.42 |
| Cistern, upstairs | 0.42 × 0.15 × 0.40, from y 0.42 | 5.16, 0.28 | — | x 4.95 – 5.37, z 0.20 – 0.35 |
| Bedroom 2 door leaf, open | 0.80 × 0.05 × 2.05 | 3.15, 3.83 | — | x 2.75 – 3.55, z 3.80 – 3.85 |
| Bedroom 1 door leaf, open | 0.05 × 0.80 × 2.05 | 3.77, 4.55 | — | x 3.75 – 3.80, z 4.15 – 4.95 |
| Shower room door leaf, open | 0.05 × 0.70 × 2.05 | 4.67, 1.25 | — | x 4.65 – 4.70, z 0.90 – 1.60 |

### Clearances (check 10)

| In front of | From | Over | Minimum | Expected |
|---|---|---|---|---|
| Dressing, bedroom 1 (doors face north) | z = 6.93, northward | x 3.20 – 5.95 | 0.60 | 0.63 |
| Dressing, bedroom 2 (doors face west) | x = 2.93, westward | z 0.20 – 2.75 | 0.60 | 0.63 |
| Linen cupboard (doors face south) | z = 2.10, southward | x 3.65 – 4.55 | 0.60 | 1.95 |
| Shower entry, upstairs | z = 1.00, southward | x 3.65 – 4.15 | 0.60 | 0.60 |
| WC, upstairs | z = 0.85, southward | x 4.95 – 5.37 | 0.60 | 0.75 |

## Part 6 — Materials

| Element | Hex |
|---|---|
| Walls (interior faces) | `#F4F2EE` |
| Street front: render on every outer face, the frame and the parapets | `#CDBBA3` |
| Street front: panels round the two street windows | `#DDD0BE` |
| Street front: pier, planters, entrance step | `#4B4A4C` |
| Street front: slats, front door, soffit under the top band | `#9A6A40` |
| Street front: slat backing, panel over the door, wall light | `#1D1F21` |
| Street front: LED lines and downlights | `#FFE3A3` |
| Street front: planting | `#5E7A45` |
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

1. Gross area per level = footprint width × depth (ground level 44.28 m², first level 50.43 m²). Net areas match the room tables within 0.1 m².
2. For every step, if any slab box overlaps its x–z extent, its top must leave 2.05 m under the 2.60 m slab underside. The starter leg and the landing sit under bedroom 1's floor; the main flight is under the void.
3. The first-level void, the slab opening as built, covers the main flight exactly; the landing and the starter leg lie outside it under a slab, and the arrival sits inside a finished room and over a single ground-level room (allowing for the partition along its edge).
4. The main flight strip is 1.25 m clear, a wall face or the guard on each flank, and no step box extends outside its leg.
5. No furniture bounding box intersects any wall box. A furniture box may touch a wall face only where its `Touches` column says so; elsewhere the minimum gap is 0.05 m.
6. No furniture bounding box intersects any clear zone.
7. No opaque furniture box intersects the vertical prism of any window opening: the opening span × sill-to-head height × 0.35 m into the room. Transparent elements (glazing, shower screens, the handrail) are exempt.
8. Every partition is clipped to the level's interior envelope (0.20 in from every facade), so no partition end face is coplanar with a facade.
9. Visibility. Sample a 5 × 5 grid on each target's top face and cast a ray to the default camera in cutaway mode (every wall at 1.20 m). Occluders are wall, slab and tread boxes only. Assert 60 % or more unobstructed. Expected: kitchen north run 100 %, fridge 100 %, sofa 100 %, double bed 100 %, bed, bedroom 2 80 %, desk, bedroom 2 100 %.
10. In front of each wardrobe, WC and shower entry, over the full width, the clear distance to the nearest furniture or wall is at least 0.60 m (expected values in the clearance tables).
11. The handrail centreline is 0.90 m above every tread nosing, and its underside clears every tread.

