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

Every window is one of these types; a level chooses only where each starts along its wall. Heads share one line, a 0.20 m lintel under the slab, except the stair slot, which runs to the wall top on both levels so its two panes read as one vertical strip.

| Type | Width | Sill | Head | Used for |
|---|---|---|---|---|
| room | 1.80 | 0.90 | 2.40 | living room and bedrooms, sofa and bed height beneath |
| high | 0.80 | 1.20 | 2.40 | WC, shower room, landing |
| kitchen | 2.10 | 1.10 | 2.40 | over the worktop |
| picture | 3.00 | 0.00 | 2.40 | bedroom 1's street front; transom at 0.90, fixed laminated glass below it as the guard |
| slotLower | 0.45 | 0.90 | 2.60 | lower half of the stair slot, fixed laminated glass over the landing |
| slotUpper | 0.45 | 0.00 | 2.60 | upper half of the stair slot, fixed, rising from the void |

**Y convention.** Per level, y = 0 is the finished floor surface. The slab occupies y −0.28 to 0.00. Walls run y 0.00 to 2.60. Both levels are modelled at the same y, side by side.

**World placement.** Build each level in local coordinates from its north-west corner, then place the ground group at world (-6.9, 0, -3.6) and the first-floor group at (0.75, 0, -4.1).

## Part 3 — Staircase

This governs both levels. Build it first. A quarter-turn stair: a starter leg along the front wall, a landing in the south-east corner, then the main flight north against the party wall.

| Item | Value |
|---|---|
| Risers | 16 × 0.180 = 2.880 m: 4 up to the landing, 12 on the main flight |
| Starter leg | climbs eastward from x 3.89 to 4.70, z 5.70 – 7.00; 3 treads of 0.270 m, tops at y = `0.18n`, approached head-on from the living room |
| Landing | x 4.70 – 5.95, z 5.70 – 7.00, top at y 0.72, solid to the floor |
| Main flight strip | x 4.70 – 5.95, clear width 1.25 m |
| Main flight | climbs northward from the landing, bottom at z = 5.70; 11 × 0.250 = 2.750 m run, extent z 2.95 – 5.70 |
| Main tread *n* (n = 1…11) | x 4.70 – 5.95, z from `5.70 − 0.25n` to `5.70 − 0.25(n−1)`, top at y = `0.72 + 0.18n` |
| Top of flight | main tread 11 top at y 2.70, z 2.95 – 3.20; riser 16 lands on the upper floor at y 2.88 |

**Steel stair.** Every tread is a 0.04 m plate in marble with open risers, carried on 0.20 × 0.02 steel stringers whose top edge runs 0.10 m under the nosing line: two under the main flight at x 4.71 and 5.94, from the landing to the slab edge, and two under the starter leg at z 5.71 and 6.99. The landing is a plate at y 0.72 on a 0.20 m frame carried by four 0.03 m posts. Only the top main tread rises above the 2.60 m wall height, topping out at 2.70 inside the slab zone; do not clip it.

**Under the stair.** Open to the living room under both legs and the landing: no wall along the main flight's west side, only the guard. The TV unit stands against the party wall under the high end of the flight.

**Headroom.** The underside of the upper slab is at 2.60. A step needs 2.05 m clear, so only steps with a top at or below 0.55 m may sit under a slab: the starter leg does, under bedroom 1's floor. The void covers the landing and the whole main flight.

**Arrival.** Riser 16 lands at z = 2.95, stepping north onto the landing at x 4.70 – 5.95, z 1.70 – 2.95, kept clear one flight width deep. The whole north edge of the void is the arrival opening; no railing there. The main flight has the east wall on one side and, on the west, a guard of 0.03 m posts on every third tread under a 0.04 m rail at handrail height; the starter leg carries the same guard along its open north side, and the two rails meet at a newel on the landing's corner.

### Handrail

| Item | Value |
|---|---|
| Wall | east wall, centreline x 5.88 (0.05 off the face) |
| Section | 0.05 × 0.05 |
| Extent | z 5.45 to z 3.20, the main flight only |
| Height | centreline 0.90 above the nosing line: `y = 0.72 × (5.70 − z) + 1.80` |
| Box | length 2.773 m, centre (5.88, 2.79, 4.33), `rotation.x = +0.6240 rad`, north end high |

Check: at z 5.70 the rail is at 1.80, 0.90 above nosing 1; at z 3.20 it is at 3.60. The handrail is exempt from check 7 and is hidden whenever its wall is cut.

## Part 4 — Ground level

### Rooms (interior faces)

| Room | Extent | Finish | Net m² |
|---|---|---|---|
| WC + laundry | x 0.20 – 2.95, z 0.20 – 1.85 | tile | 4.54 (table 4.5) |
| Kitchen | x 3.20 – 5.95, z 0.20 – 2.85, plus x 3.20 – 4.70, z 2.85 – 2.90 | marble | 7.36 (table 7.4) |
| Living / dining | x 0.20 – 4.60, z 3.00 – 7.00, plus x 0.20 – 2.95, z 1.95 – 3.00 and x 4.60 – 4.70, z 3.00 – 5.70 | marble | 20.76 (table 20.8) |
| Stair | x 4.70 – 5.95, z 2.95 – 7.00 | marble | 5.06 (table 5.1) |

Footprint 6.15 × 7.20 m, gross 44.28 m² to the exterior face; net 37.72 m² (table 37.7).

### Partitions (thickness 0.10 unless noted, height 2.60, clipped to the interior envelope)

| Ref | Centreline | Extent |
|---|---|---|
| P1 | z = 1.90 | x 0.20 – 2.95 |
| P8 | x = 3.08 | z 0.20 – 1.95, 0.25 thick |
| P8b | x = 3.18 | z 1.95 – 2.75, 0.05 thick |
| P10 | z = 2.95 | x 3.20 – 4.70 |
| P6 | z = 2.90 | x 4.70 – 5.95 |

### Columns (structural, floor to slab, same position on both levels)

| Ref | Extent | Section |
|---|---|---|
| C1 | x 2.95 – 3.20, z 2.75 – 3.00 | 0.25 × 0.25 |

### Openings

| Ref | Wall | Position along wall | Width | Sill | Head | Kind |
|---|---|---|---|---|---|---|
| Win2 | north, z 0.10 | x 3.60 – 5.70 | 2.10 | 1.10 | 2.40 | window |
| Win5 | south, z 7.10 | x 0.60 – 2.40 | 1.80 | 0.90 | 2.40 | window |
| D1 | south, z 7.10 | x 2.85 – 3.85 | 1.00 | 0.00 | 2.10 | door |
| Win6 | south, z 7.10 | x 5.10 – 5.55 | 0.45 | 0.90 | 2.60 | glazed to ceiling |
| Win3 | west, x 0.10 | z 1.00 – 1.80 | 0.80 | 1.20 | 2.40 | window |
| Win4 | west, x 0.10 | z 4.70 – 6.50 | 1.80 | 0.90 | 2.40 | window |
| D2 | P1, z 1.90 | x 2.05 – 2.75 | 0.70 | 0.00 | 2.05 | door |
| G1 | P10, z 2.95 | x 3.20 – 3.80 | 0.60 | 0.00 | 2.60 | glazed to ceiling |
| D3 | P10, z 2.95 | x 3.80 – 4.70 | 0.90 | 0.00 | 2.60 | opening, no leaf |

Blind walls, no openings: east.

### Clear zones — no furniture may enter these

| Opening | Clear zone |
|---|---|
| D1 | x 2.75 – 3.89, z 5.80 – 7.00 |
| D2 | x 1.95 – 2.85, z 1.25 – 2.45 |
| kitchen | x 3.80 – 4.70, z 2.30 – 3.60 |
| stairFoot | x 2.85 – 3.89, z 5.70 – 7.00 |

### Furniture (position = centre, footprint w × d, height from floor)

A piece may touch a wall face only where the `Touches` column says so. Everywhere else the minimum gap to any wall face is 0.05 m.

| Piece | w × d × h | Centre (x, z) | Touches | Extent |
|---|---|---|---|---|
| Sofa | 0.85 × 2.10 × 0.80 | 0.63, 4.60 | west | x 0.20 – 1.05, z 3.55 – 5.65 |
| Armchair | 2 boxes | 1.70, 6.15 | — | x 1.30 – 2.10, z 5.75 – 6.55 |
| Sideboard | 1.00 × 0.40 × 0.85 | 1.85, 6.80 | south | x 1.35 – 2.35, z 6.60 – 7.00 |
| TV unit | 0.40 × 1.30 × 0.50 | 5.75, 3.65 | east | x 5.55 – 5.95, z 3.00 – 4.30 |
| Dining table | 5 boxes | 2.43, 4.78 | — | x 1.83 – 3.03, z 4.38 – 5.17 |
| Chair W | 2 boxes | 1.78, 4.78 | — | x 1.55 – 2.00, z 4.55 – 5.00 |
| Chair E | 2 boxes | 3.08, 4.78 | — | x 2.85 – 3.31, z 4.55 – 5.00 |
| Chair N | 2 boxes | 2.43, 4.13 | — | x 2.21 – 2.65, z 3.90 – 4.35 |
| Chair S | 2 boxes | 2.43, 5.42 | — | x 2.21 – 2.65, z 5.20 – 5.65 |
| Kitchen north run | 2.15 × 0.60 × 0.90 | 4.28, 0.50 | north, P8 | x 3.20 – 5.35, z 0.20 – 0.80 |
| Kitchen east run | 0.60 × 1.35 × 0.90 | 5.65, 1.48 | east | x 5.35 – 5.95, z 0.80 – 2.15 |
| Fridge | 0.65 × 0.60 × 1.80 | 5.63, 2.50 | east | x 5.30 – 5.95, z 2.20 – 2.80 |
| Wall cabinets | 0.35 × 1.35 × 0.60, from y 1.50 | 5.78, 1.48 | east | x 5.60 – 5.95, z 0.80 – 2.15 |
| Tall cabinet | 0.60 × 0.95 × 2.10 | 3.50, 2.02 | P8, P8b | x 3.20 – 3.80, z 1.55 – 2.50 |
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
| TV | 0.04 × 1.10 × 0.62, from y 0.50 | 5.59, 3.65 | — | x 5.57 – 5.61, z 3.10 – 4.20 |
| Floor lamp | 3 boxes | 0.50, 3.25 | — | x 0.33 – 0.68, z 3.08 – 3.42 |
| Plant | 2 boxes | 5.10, 4.60 | — | x 4.75 – 5.45, z 4.25 – 4.95 |
| Cistern | 0.15 × 0.42 × 0.40, from y 0.42 | 0.28, 1.49 | — | x 0.20 – 0.35, z 1.28 – 1.70 |
| Front door leaf, open | 0.05 × 1.00 × 2.10 | 2.88, 6.50 | — | x 2.85 – 2.90, z 6.00 – 7.00 |
| WC door leaf, open | 0.05 × 0.70 × 2.05 | 2.73, 1.50 | — | x 2.70 – 2.75, z 1.15 – 1.85 |
| Decor on the hall shelves | 3 boxes | 3.06, 2.15 | — | x 2.99 – 3.13, z 2.09 – 2.60 |
| Kitchen sliding glass door, open | 5 boxes | 3.35, 3.03 | — | x 2.90 – 3.80, z 3.01 – 3.05 |

### Clearances (check 10)

| In front of | From | Over | Minimum | Expected |
|---|---|---|---|---|
| WC, ground floor | x = 0.85, eastward | z 1.28 – 1.70 | 0.60 | 2.10 |
| Hand basin, ground floor | z = 0.55, southward | x 1.07 – 1.52 | 0.60 | 1.30 |
| Laundry shelving (faces west) | x = 2.60, westward | z 0.20 – 1.00 | 0.60 | 1.07 |
| Tall cabinet, kitchen (doors face east) | x = 3.80, eastward | z 1.55 – 2.50 | 0.60 | 1.50 |

## Part 5 — First level

### Rooms (interior faces)

| Room | Extent | Finish | Net m² |
|---|---|---|---|
| Landing | x 3.65 – 5.95, z 1.70 – 2.95, plus x 3.65 – 4.60, z 2.95 – 4.05 | marble | 3.92 (table 3.9) |
| Shower room | x 3.65 – 5.95, z 0.20 – 1.60 | tile | 3.22 (table 3.2) |
| Stair void | x 4.70 – 5.95, z 2.95 – 8.00 | — | 6.31 (table 6.3) |
| Bedroom 2 | x 0.20 – 2.95, z 0.20 – 4.05, plus x 2.95 – 3.55, z 0.20 – 2.75 and x 2.95 – 3.55, z 3.00 – 4.05 | wood | 12.75 (table 12.7) |
| Bedroom 1 | x 0.20 – 4.60, z 4.15 – 8.00 | wood | 16.94 (table 16.9) |

Footprint 6.15 × 8.20 m, gross 50.43 m² to the exterior face; net 43.14 m² (table 43.1).

### Partitions (thickness 0.10 unless noted, height 2.60, clipped to the interior envelope)

| Ref | Centreline | Extent |
|---|---|---|
| P4 | x = 4.65 | z 2.95 – 8.00 |
| P5 | x = 3.60 | z 0.20 – 4.05 |
| P7 | z = 4.10 | x 0.20 – 4.60 |
| P9 | z = 1.65 | x 3.65 – 5.95 |
| N1 | z = 2.88 | x 3.20 – 3.55, 0.25 thick |

### Columns (structural, floor to slab, same position on both levels)

| Ref | Extent | Section |
|---|---|---|
| C1 | x 2.95 – 3.20, z 2.75 – 3.00 | 0.25 × 0.25 |

### Openings

| Ref | Wall | Position along wall | Width | Sill | Head | Kind |
|---|---|---|---|---|---|---|
| Win9 | north, z 0.10 | x 4.20 – 5.00 | 0.80 | 1.20 | 2.40 | window |
| Win11 | south, z 8.10 | x 1.45 – 4.45 | 3.00 | 0.00 | 2.40 | window |
| Win15 | south, z 8.10 | x 5.10 – 5.55 | 0.45 | 0.00 | 2.60 | glazed to ceiling |
| Win8 | west, x 0.10 | z 0.50 – 2.30 | 1.80 | 0.90 | 2.40 | window |
| Win14 | west, x 0.10 | z 4.70 – 6.50 | 1.80 | 0.90 | 2.40 | window |
| Win13 | east, x 6.05 | z 1.80 – 2.60 | 0.80 | 1.20 | 2.40 | window |
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
| Double bed | 1.60 × 2.00 × 0.50 | 1.85, 5.27 | — | x 1.05 – 2.65, z 4.27 – 6.27 |
| Headboard, bedroom 1 | 1.70 × 0.12 × 0.50 | 1.85, 4.21 | P7 | x 1.00 – 2.70, z 4.15 – 4.27 |
| Nightstand, bedroom 1 west | 0.40 × 0.40 × 0.45 | 0.80, 4.40 | — | x 0.60 – 1.00, z 4.20 – 4.60 |
| Nightstand, bedroom 1 east | 0.40 × 0.40 × 0.45 | 2.90, 4.40 | — | x 2.70 – 3.10, z 4.20 – 4.60 |
| Wardrobe, bedroom 1 | 0.60 × 1.20 × 2.10 | 4.30, 6.20 | P4 | x 4.00 – 4.60, z 5.60 – 6.80 |
| Bed, bedroom 2 | 1.40 × 1.90 × 0.50 | 1.00, 2.98 | — | x 0.30 – 1.70, z 2.03 – 3.93 |
| Headboard, bedroom 2 | 1.50 × 0.12 × 0.50 | 1.00, 3.99 | P7 | x 0.25 – 1.75, z 3.93 – 4.05 |
| Nightstand, bedroom 2 | 0.40 × 0.40 × 0.45 | 1.95, 3.80 | — | x 1.75 – 2.15, z 3.60 – 4.00 |
| Wardrobe, bedroom 2 | 0.60 × 1.75 × 2.10 | 3.25, 1.88 | P5, C1, N1 | x 2.95 – 3.55, z 1.00 – 2.75 |
| Desk, bedroom 2 | 0.90 × 0.55 × 0.74 | 2.40, 0.47 | north | x 1.95 – 2.85, z 0.20 – 0.75 |
| Linen cupboard | 0.90 × 0.40 × 2.10 | 4.10, 1.90 | P9, P5 | x 3.65 – 4.55, z 1.70 – 2.10 |
| Shower tray, upstairs | 0.90 × 0.80 × 0.08 | 4.10, 0.60 | north, P5 | x 3.65 – 4.55, z 0.20 – 1.00 |
| Shower screen, east panel, upstairs | 0.02 × 0.80 × 1.90, from y 0.08 | 4.54, 0.60 | north | x 4.53 – 4.55, z 0.20 – 1.00 |
| Shower screen, south panel, upstairs | 0.40 × 0.02 × 1.90, from y 0.08 | 4.35, 0.99 | — | x 4.15 – 4.55, z 0.98 – 1.00 |
| WC, upstairs | 0.42 × 0.65 × 0.42 | 5.16, 0.53 | north | x 4.95 – 5.37, z 0.20 – 0.85 |
| Basin, upstairs | 0.40 × 0.50 × 0.85 | 5.75, 1.30 | east | x 5.55 – 5.95, z 1.05 – 1.55 |

### Dressing (rendered only, never measured)

| Piece | w × d × h | Centre (x, z) | Touches | Extent |
|---|---|---|---|---|
| Pillows | 2 boxes | 1.45, 4.55 | — | x 1.15 – 2.55, z 4.35 – 4.75 |
| Throw | 1.60 × 0.70 × 0.04, from y 0.50 | 1.85, 5.85 | — | x 1.05 – 2.65, z 5.50 – 6.20 |
| Pillow | 0.60 × 0.40 × 0.12, from y 0.50 | 1.00, 3.65 | — | x 0.70 – 1.30, z 3.45 – 3.85 |
| Throw | 1.40 × 0.60 × 0.04, from y 0.50 | 1.00, 2.45 | — | x 0.30 – 1.70, z 2.15 – 2.75 |
| Monitor | 2 boxes | 2.40, 0.30 | — | x 2.15 – 2.65, z 0.28 – 0.42 |
| Cistern, upstairs | 0.42 × 0.15 × 0.40, from y 0.42 | 5.16, 0.28 | — | x 4.95 – 5.37, z 0.20 – 0.35 |
| Bedroom 2 door leaf, open | 0.80 × 0.05 × 2.05 | 3.15, 3.83 | — | x 2.75 – 3.55, z 3.80 – 3.85 |
| Bedroom 1 door leaf, open | 0.05 × 0.80 × 2.05 | 3.77, 4.55 | — | x 3.75 – 3.80, z 4.15 – 4.95 |
| Shower room door leaf, open | 0.05 × 0.70 × 2.05 | 4.67, 1.25 | — | x 4.65 – 4.70, z 0.90 – 1.60 |

### Clearances (check 10)

| In front of | From | Over | Minimum | Expected |
|---|---|---|---|---|
| Wardrobe, bedroom 1 (doors face west) | x = 4.00, westward | z 5.60 – 6.80 | 0.60 | 1.35 |
| Wardrobe, bedroom 2 (doors face west) | x = 2.95, westward | z 1.00 – 2.75 | 0.60 | 1.25 |
| Linen cupboard (doors face south) | z = 2.10, southward | x 3.65 – 4.55 | 0.60 | 1.95 |
| Shower entry, upstairs | z = 1.00, southward | x 3.65 – 4.15 | 0.60 | 0.60 |
| WC, upstairs | z = 0.85, southward | x 4.95 – 5.37 | 0.60 | 0.75 |

## Part 6 — Materials

| Element | Hex |
|---|---|
| Walls; exterior faces of the ground level | `#F4F2EE` |
| Facade cladding, outer faces of the first level | `#A47A52` |
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
2. For every step, if any slab box overlaps its x–z extent, its top must leave 2.05 m under the 2.60 m slab underside. The starter leg sits under bedroom 1's floor; the landing and the main flight are under the void.
3. The first-level void covers the ground-level stair room exactly, running on only over the overhang; the landing and main flight lie within it, the starter leg lies outside it under a slab, and the arrival sits over a single ground-level room (allowing for the partition along its edge).
4. The main flight strip is 1.25 m clear, a wall face or the guard on each flank, and no step box extends outside its leg.
5. No furniture bounding box intersects any wall box. A furniture box may touch a wall face only where its `Touches` column says so; elsewhere the minimum gap is 0.05 m.
6. No furniture bounding box intersects any clear zone.
7. No opaque furniture box intersects the vertical prism of any window opening: the opening span × sill-to-head height × 0.35 m into the room. Transparent elements (glazing, shower screens, the handrail) are exempt.
8. Every partition is clipped to the level's interior envelope (0.20 in from every facade), so no partition end face is coplanar with a facade.
9. Visibility. Sample a 5 × 5 grid on each target's top face and cast a ray to the default camera in cutaway mode (every wall at 1.20 m). Occluders are wall, slab and tread boxes only. Assert 60 % or more unobstructed. Expected: kitchen north run 100 %, fridge 100 %, sofa 100 %, double bed 100 %, bed, bedroom 2 80 %, desk, bedroom 2 100 %.
10. In front of each wardrobe, WC and shower entry, over the full width, the clear distance to the nearest furniture or wall is at least 0.60 m (expected values in the clearance tables).
11. The handrail centreline is 0.90 m above every tread nosing, and its underside clears every tread.

