# 3D house model — build spec v2.1

Two-storey house, 6.00 × 6.00 m per level, 36.00 m² gross each.

This is the complete specification. It supersedes v1, v2 and the v2.1 patch. Do not merge it with any of them.

---

## Part 1 — Prompt to give your dev agent

> Build an interactive 3D model of a small two-storey house using Three.js (r150+, ES modules, `OrbitControls`).
>
> Render into a container div that fills the parent width, height 480 px. Transparent renderer background (`alpha: true`), with a `ShadowMaterial` plane at y = −0.30 to catch shadows. Lighting: `HemisphereLight` (sky `#ffffff`, ground `#9d978c`, intensity 0.8) and one `DirectionalLight` (`#fff2e0`, intensity 0.8) at (10, 16, 8), shadows on, 1024 map, orthographic shadow camera bounds ±14.
>
> Model the two levels as two groups placed side by side, ground level to the west, first level to the east, so both interiors are visible at once. No roofs, no ceilings.
>
> Every wall, slab, tread and furniture piece is a `BoxGeometry` mesh with `MeshLambertMaterial`. No CSG. Build openings by splitting each wall into segments — a wall carries a list of openings, so write a generic splitter that walks the wall's length and emits a pier between each pair of openings, plus a sill block below and a lintel block above each opening. Several walls carry two or three openings. An opening may sit flush against the end of its wall (D4 runs to the south wall face): the splitter must emit a zero-length pier without erroring or producing a degenerate box. Put a thin translucent box in each window opening as glazing.
>
> Add a cutaway toggle. In cutaway mode (the default) every wall renders at 1.20 m high, and glazing and the stair handrail are hidden. In full mode walls render at 2.60 m with glazing and the handrail shown. Add buttons for both levels / ground only / first only / reset view.
>
> All dimensions are metres. Coordinate system per level: X east, Z south, Y up, origin at the north-west corner of the exterior face, y = 0 at the finished floor surface of that level.
>
> Controls: left-drag orbits, scroll zooms (clamp distance 11–42 m), no panning. Default camera azimuth 2.36 rad, polar 0.95 rad, distance 21 m, target (0, 1.1, 0). `touch-action: none` on the canvas, pointer events, handle window resize.

---

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
| Cutaway wall height (default render) | 1.20 m |

Exterior wall centrelines: north z = 0.10, south z = 5.90, west x = 0.10, east x = 5.90. Finished interior faces are at 0.20 and 5.80.

**Y convention.** Per level, y = 0 is the finished floor surface. The slab occupies y −0.28 to 0.00. Walls run y 0.00 to 2.60. Both levels are modelled at the same y — they sit side by side, not stacked.

**World placement.** Build each level in local coordinates 0–6. Then place the ground group at world (−6.75, 0, −3) and the first-floor group at (+0.75, 0, −3). The pair is then centred on the world origin with a 1.50 m gap between them.

---

## Part 3 — Staircase

This governs both levels. Build it first.

| Item | Value |
|---|---|
| Strip | x 4.55 – 5.80, clear width 1.25 m |
| Direction | climbs northward, bottom at z = 5.80 |
| Risers | 16 × 0.180 = 2.880 m |
| Treads | 15 × 0.250 = 3.750 m run |
| Flight extent | z 2.05 – 5.80 |
| Tread *n* (n = 1…15) | x 4.55–5.80, z from `5.80 − 0.25n` to `5.80 − 0.25(n−1)`, top surface at y = `0.18n` |
| Top of flight | tread 15 top at y 2.70, z 2.05–2.30; riser 16 lands on the upper floor at y 2.88 |

Model each tread as a solid box from y = 0 to `0.18n` — a stepped stack, which is how a poured concrete stair actually looks.

There are 15 treads. Only tread 15 rises above the 2.60 m wall height, topping out at 2.70 inside the 0.28 m slab zone between 2.60 and 2.88. Tread 14 stops at 2.52. Riser 16 is the final step onto the upper floor, not a tread. Do not clip tread 15.

**Headroom.** The underside of the upper slab is at 2.60. A tread needs 2.05 m clear, so only treads with a top at or below 0.55 m may sit under a slab — that is treads 1 to 3. The void therefore covers the entire flight, z 2.05 – 5.80. There is no tread under a slab in this design, so headroom is 2.60 m everywhere on the flight.

**Arrival.** Riser 16 lands at z = 2.05, stepping north onto the landing at x 4.55–5.80, z 0.20–2.05. Because the flight is the full 1.25 m width of the strip, the whole north edge of the void is the arrival opening. **No railing there.** The flight is enclosed by P3 / P6 on the west and the east wall on the east; a wall-mounted handrail runs on the east wall.

### Handrail

| Item | Value |
|---|---|
| Section | 0.05 × 0.05 |
| Wall offset | 0.05 from the east wall face, centreline at x 5.725 |
| Extent | z 5.55 to z 2.30 |
| Height | centreline 0.90 above the nosing line: `y = 0.72 × (5.80 − z) + 1.08` |
| Box | length 4.005 m, centre (5.725, 2.43, 3.925), `rotation.x = +0.6240 rad` (`atan(0.18 / 0.25)`), north end high |
| Material | joinery |

The nosing of tread *n* is at z = `5.80 − 0.25(n−1)`, height `0.18n`; the line through the nosings is `y = 0.72 × (5.80 − z) + 0.18`, and the rail sits 0.90 above it. Check: at z 5.80 the rail is at 1.08, 0.90 above nosing 1 at 0.18; at z 2.30 it is at 3.60, 0.90 above nosing 15 at 2.70.

The rail passes in front of Win 6 across the whole window span, between 1.22 m (z 5.60) and 1.80 m (z 4.80), above the 1.20 sill and below the 2.20 head. That is ordinary construction — a 50 mm handrail passing a stair window is not an obstruction. The handrail is exempt from check 7. Its top end at 3.60 m is above every other element in the ground group; that is correct for the building, where the east wall continues through the first floor, and it is why the handrail is hidden in cutaway mode.

---

## Part 4 — Ground level

### Rooms

| Room | X (interior faces) | Z (interior faces) | Net area |
|---|---|---|---|
| Bathroom + laundry | 0.20 – 2.50 | 0.20 – 1.95 | 4.0 m² |
| Kitchen | 2.60 – 5.80 | 0.20 – 1.95 | 5.6 m² |
| Living / dining | 0.20 – 4.45 | 2.05 – 5.80 | 15.9 m² |
| Stair | 4.55 – 5.80 | 2.05 – 5.80 | 4.7 m² |
| **Net total** | | | **30.2 m²** |

Gross is 36.00 m² to the exterior face. Net internal is 30.2 m². State both to the client so nobody reads the kitchen as more floor than it is.

Floor finishes: tile in bathroom, kitchen and stair; wood in living / dining.

### Partitions (thickness 0.10, height 2.60, clipped to the interior envelope)

| Ref | Centreline | Extent | Separates |
|---|---|---|---|
| P1 | z = 2.00 | x 0.20 – 5.80 | living / bathroom + kitchen, and kitchen / top of stair |
| P2 | x = 2.55 | z 0.20 – 1.95 | bathroom / kitchen |
| P3 | x = 4.50 | z 2.05 – 5.80 | living / stair |

### Openings

| Ref | Wall | Position along wall | Width | Sill | Head |
|---|---|---|---|---|---|
| D1 front door | south, z 5.90 | x 2.60 – 3.60 | 1.00 | 0.00 | 2.10 |
| D2 bathroom | P1, z 2.00 | x 0.90 – 1.70 | 0.80 | 0.00 | 2.05 |
| D3 kitchen (no leaf) | P1, z 2.00 | x 2.90 – 3.80 | 0.90 | 0.00 | 2.05 |
| D4 stair (no leaf) | P3, x 4.50 | z 4.80 – 5.80 | 1.00 | 0.00 | 2.20 |
| Win 1 bathroom | north, z 0.10 | x 0.70 – 1.50 | 0.80 | 1.40 | 2.20 |
| Win 2 kitchen | north, z 0.10 | x 2.90 – 4.10 | 1.20 | 1.10 | 2.20 |
| Win 3 kitchen | east, x 5.90 | z 0.90 – 1.70 | 0.80 | 1.10 | 2.20 |
| Win 4 living | west, x 0.10 | z 2.60 – 4.20 | 1.60 | 0.90 | 2.20 |
| Win 5 living | south, z 5.90 | x 0.60 – 2.00 | 1.40 | 0.90 | 2.20 |
| Win 6 stair | east, x 5.90 | z 4.80 – 5.60 | 0.80 | 1.20 | 2.20 |

Win 6 sits over treads 1 to 4, whose tops run 0.18 to 0.72 m. Sill at 1.20 clears them.

Win 1 sits partly over the basin, whose top at 0.85 is well below the 1.40 sill.

The north wall carries Win 1 and Win 2, the south wall carries D1 and Win 5, the east wall carries Win 3 and Win 6, and P1 carries D2 and D3. D4 runs to the south wall face, so its south pier has zero length.

### Clear zones — no furniture may enter these

| Opening | Clear zone |
|---|---|
| D1 | x 2.40 – 3.80, z 4.60 – 5.80 |
| D2 | x 0.80 – 1.80, z 1.45 – 2.65 |
| D3 | x 2.80 – 3.90, z 1.45 – 2.65 |
| D4 | x 3.90 – 4.55, z 4.80 – 5.80 |

### Furniture (position = centre, footprint w × d, height from floor)

A piece may touch a wall face only where the `Touches` column says so. Everywhere else the minimum gap to any wall face is 0.05 m.

| Piece | w × d × h | Centre (x, z) | Touches | Extent and notes |
|---|---|---|---|---|
| Sofa | 0.85 × 2.10 × 0.80 | 0.625, 4.65 | west wall face x 0.20 | x 0.20–1.05, z 3.60–5.70; back to the wall, depth runs in x |
| Coffee table | 1.00 × 0.55 × 0.38 | 1.85, 4.65 | — | x 1.35–2.35, z 4.375–4.925 |
| TV unit | 0.40 × 1.30 × 0.50 | 4.25, 4.05 | P3 face x 4.45 | x 4.05–4.45, z 3.40–4.70; clears the D4 zone by 0.10 and faces the sofa |
| Dining table top | 1.30 × 0.80 × 0.05 | 2.80, 3.05 | — | x 2.15–3.45, z 2.65–3.45; underside y 0.70, surface y 0.75 |
| Dining table legs ×4 | 0.07 × 0.07 × 0.70 | 2.265, 2.765 · 3.335, 2.765 · 2.265, 3.335 · 3.335, 3.335 | — | y 0–0.70; outer faces inset 0.08 from the top's corners |
| Chair W seat | 0.45 × 0.45 × 0.45 | 1.90, 3.05 | — | x 1.675–2.125, z 2.825–3.275 |
| Chair E seat | 0.45 × 0.45 × 0.45 | 3.70, 3.05 | — | x 3.475–3.925, z 2.825–3.275 |
| Chair S seat | 0.45 × 0.45 × 0.45 | 2.80, 3.85 | — | x 2.575–3.025, z 3.625–4.075 |
| Kitchen base run | 2.35 × 0.60 × 0.90 | 3.875, 0.50 | north wall face z 0.20 | x 2.70–5.05, z 0.20–0.80; top 0.90 is below the Win 2 sill |
| Wall cabinets | 0.80 × 0.35 × 0.60 | 4.60, 0.375 | north wall face z 0.20 | x 4.20–5.00, z 0.20–0.55; underside y 1.50, top 2.10; clear of Win 2 by 0.10 |
| Fridge | 0.60 × 0.65 × 1.80 | 5.45, 0.575 | — | x 5.15–5.75, z 0.25–0.90; clear of Win 3 |
| Shower tray | 0.90 × 0.90 × 0.08 | 2.05, 0.65 | north wall face z 0.20, P2 face x 2.50 | x 1.60–2.50, z 0.20–1.10; flush in its corner |
| Shower screen, south panel | 0.90 × 0.02 × 1.90 | 2.05, 1.09 | P2 face x 2.50 | x 1.60–2.50, z 1.08–1.10; stands on the tray, y 0.08–1.98 |
| Shower screen, west panel | 0.02 × 0.35 × 1.90 | 1.61, 0.375 | north wall face z 0.20 | x 1.60–1.62, z 0.20–0.55; stands on the tray, y 0.08–1.98 |
| Basin | 0.60 × 0.45 × 0.85 | 0.55, 0.425 | north wall face z 0.20 | x 0.25–0.85, z 0.20–0.65 |
| WC | 0.42 × 0.65 × 0.42 | 0.46, 1.575 | — | x 0.25–0.67, z 1.25–1.90; the pan stands 0.05 off the west wall |
| Washing machine | 0.60 × 0.60 × 0.85 | 2.15, 1.60 | — | x 1.85–2.45, z 1.30–1.90 |

**Dining table.** Model as a top plus four legs, not one solid box, so the chairs can sit close. Chairs W and E clear the nearest leg by 0.10 m and the edge of the tabletop by 0.025 m.

**Chair backs.** Each back is a box 0.08 thick, 0.45 wide and 0.45 high, sitting on the seat at y 0.45–0.90, on the face away from the table:

| Chair | Back extent |
|---|---|
| W | x 1.675–1.755, z 2.825–3.275 |
| E | x 3.845–3.925, z 2.825–3.275 |
| S | x 2.575–3.025, z 3.995–4.075 |

**Shower.** The tray sits flush in the north-east corner of the bathroom. The south panel runs the full width of the tray because the washing machine stands 0.20 m in front of it. The shower is entered from the west, through the 0.55 m gap at x 1.60, z 0.55–1.10, which opens onto 0.75 m of clear floor between the basin and the WC. Both panels stand on the tray and sit inside its footprint; they do not meet each other.

---

## Part 5 — First level

### Rooms

| Room | X (interior faces) | Z (interior faces) | Net area |
|---|---|---|---|
| Bedroom 1 | 0.20 – 3.35 | 0.20 – 3.20 | 9.5 m² |
| Bedroom 2 | 0.20 – 4.45 | 3.30 – 5.80 | 10.6 m² |
| Corridor | 3.45 – 4.45 | 0.20 – 3.20 | 3.0 m² |
| Landing | 4.55 – 5.80 | 0.20 – 2.05 | 2.3 m² |
| Stair void | 4.55 – 5.80 | 2.05 – 5.80 | 4.7 m² |
| **Net total** | | | **30.1 m²** |

### Slab

The slab has a hole at the stair void. Build it as two boxes:

- x 0.00 – 4.55, z 0.00 – 6.00
- x 4.55 – 6.00, z 0.00 – 2.05

Floor finishes: wood in both bedrooms, tile in corridor and landing.

### Partitions (thickness 0.10, height 2.60)

| Ref | Centreline | Extent | Separates |
|---|---|---|---|
| P4 | x = 3.40 | z 0.20 – 3.20 | bedroom 1 / corridor |
| P5 | z = 3.25 | x 0.20 – 4.45 | bedroom 1 + corridor / bedroom 2 |
| P6 | x = 4.50 | z 0.20 – 5.80 | corridor + bedroom 2 / landing + void |

### Openings

| Ref | Wall | Position along wall | Width | Sill | Head |
|---|---|---|---|---|---|
| D5 landing → corridor | P6, x 4.50 | z 0.75 – 1.65 | 0.90 | 0.00 | 2.05 |
| D6 bedroom 1 | P4, x 3.40 | z 1.30 – 2.20 | 0.90 | 0.00 | 2.05 |
| D7 bedroom 2 | P5, z 3.25 | x 3.50 – 4.40 | 0.90 | 0.00 | 2.05 |
| Win 7 bedroom 1 | north, z 0.10 | x 1.00 – 2.60 | 1.60 | 0.90 | 2.20 |
| Win 8 bedroom 1 | west, x 0.10 | z 0.60 – 1.80 | 1.20 | 0.90 | 2.20 |
| Win 9 corridor | north, z 0.10 | x 3.60 – 4.30 | 0.70 | 1.20 | 2.20 |
| Win 10 landing | north, z 0.10 | x 4.90 – 5.60 | 0.70 | 1.20 | 2.20 |
| Win 11 bedroom 2 | south, z 5.90 | x 1.20 – 2.80 | 1.60 | 0.90 | 2.20 |
| Win 12 bedroom 2 | west, x 0.10 | z 4.80 – 5.60 | 0.80 | 0.90 | 2.20 |

The north wall carries three openings (Win 7, 9, 10) and the west wall carries two.

### Clear zones

| Opening | Clear zone |
|---|---|
| D5 | x 3.90 – 5.15, z 0.65 – 1.75 |
| D6 | x 2.75 – 4.05, z 1.20 – 2.30 |
| D7 | x 3.40 – 4.50, z 2.65 – 3.90 |

### Furniture

| Piece | w × d × h | Centre (x, z) | Touches | Extent and notes |
|---|---|---|---|---|
| Double bed | 1.60 × 2.00 × 0.50 | 1.00, 1.32 | west wall face x 0.20 | x 0.20–1.80, z 0.32–2.32 |
| Headboard, bedroom 1 | 1.60 × 0.12 × 0.50 | 1.00, 0.26 | north wall face z 0.20, west wall face x 0.20 | x 0.20–1.80, z 0.20–0.32; the bed runs into the corner, so the headboard touches both walls |
| Nightstand | 0.40 × 0.40 × 0.45 | 2.10, 0.45 | — | x 1.90–2.30, z 0.25–0.65; one only, the bed's west side is against the wall |
| Wardrobe, bedroom 1 | 1.20 × 0.60 × 2.10 | 2.55, 2.90 | P5 face z 3.20 | x 1.95–3.15, z 2.60–3.20; doors face north onto 1.95 m of open floor |
| Bed, bedroom 2 | 1.40 × 1.90 × 0.50 | 2.30, 4.73 | — | x 1.60–3.00, z 3.78–5.68 |
| Headboard, bedroom 2 | 1.50 × 0.12 × 0.50 | 2.30, 5.74 | south wall face z 5.80 | x 1.55–3.05, z 5.68–5.80; meets the bed at 5.68 with no overlap |
| Wardrobe, bedroom 2 | 0.60 × 1.20 × 2.10 | 0.50, 4.00 | west wall face x 0.20 | x 0.20–0.80, z 3.40–4.60; doors face east, 0.80 m clear to the bed |
| Desk | 1.10 × 0.55 × 0.74 | 3.70, 5.525 | south wall face z 5.80 | x 3.15–4.25, z 5.25–5.80; clears Win 11, the bed, P6 and the D7 zone |

Both headboards touch their wall. Do not leave the beds floating. Both bed tops at 0.50 are below every window sill, so they do not enter a window prism.

Bedroom 1 keeps a clear 1.55 m circulation strip between the bed and P4, and the wardrobe has no overlap in x with the bed, so its doors swing into open floor.

---

## Part 6 — Materials

| Element | Hex |
|---|---|
| Walls | `#F2EFE8` |
| Slab, structure, stair | `#BEB9AF` |
| Wood floor | `#C69C6D` |
| Tiled floor | `#DAD6CD` |
| Joinery, wardrobes, tables, handrail | `#A9784E` |
| Upholstery | `#8FA6A0` |
| Bedding | `#EDE9E1` |
| Sanitary fittings, appliances | `#F7F5F1` |
| Glazing, shower screens | `#9FC3D8`, opacity 0.45 |

Fixed scene colours. Do not swap them for light/dark theme variables, or half the model inverts and half does not.

---

## Part 7 — Acceptance checks

Run these as assertions, not as a reading exercise.

1. Gross area per level = 36.00 m². Net areas sum to 30.2 (ground) and 30.1 (first) within 0.1 m².
2. For every tread *n*, if any slab box overlaps that tread's x–z extent, then `2.60 − 0.18n ≥ 2.05`. With the void at z 2.05–5.80 no tread is under a slab, so this passes vacuously — assert it anyway, because it is the check that failed in v1.
3. The ground-level stair room, x 4.55–5.80 and z 2.05–5.80, lies entirely within the first level's stair void, which occupies the same extent. Separately, the first level's landing, x 4.55–5.80 and z 0.20–2.05, sits over the east end of the ground-level kitchen plus the P1 partition: its south edge at z 2.05 is P1's far face.
4. Stair clear width, measured between the finished face of P3 (x 4.55) and the finished face of the east wall (x 5.80), = 1.25 m. No tread box extends outside that span.
5. No furniture bounding box intersects any wall box. A furniture box may touch a wall face only where its `Touches` column says so; elsewhere the minimum gap is 0.05 m.
6. No furniture bounding box intersects any clear zone listed in Parts 4 and 5.
7. No furniture box intersects the vertical prism of any window opening, i.e. the opening span × sill-to-head height × 0.35 m into the room. Exempt: transparent elements (glazing, shower screens, the handrail), and the kitchen base run under Win 2, whose top at 0.90 is below the 1.10 sill.
8. Every partition is clipped to 0.20 ≤ x, z ≤ 5.80, so no partition end face is coplanar with a facade.
9. Visibility. Sample a 5 × 5 grid of points on each piece's top face. Cast a ray from each point to the camera. Occluders are wall boxes, slab boxes and tread boxes only — not other furniture. Run it in cutaway mode at the default camera. Assert 60 % or more of the sample points are unobstructed for: kitchen base run, fridge, sofa, both beds, desk. Expected with this geometry: base run 68 %, fridge 100 %, sofa 100 %, double bed 96 %, bed 2 80 %, desk 100 %. In full-height mode most pieces fail this, which is expected and is why cutaway is the default.
10. In front of each wardrobe, over its full width, and in front of the shower entry, over its full 0.55 m width, the clear distance to the nearest furniture or wall is at least 0.60 m. Expected: 1.95 m (wardrobe, bedroom 1), 0.80 m (wardrobe, bedroom 2), 0.75 m (shower entry).
11. The handrail centreline is 0.90 m above every tread nosing, and no rail box intersects a tread box.

---

## Note on the roof terrace

Dropped. A third level needs a third flight, and the landing at x 4.55–5.80, z 0.20–2.05 is only 1.85 m long — it cannot host a 3.75 m run. Reaching a roof terrace from a 6 × 6 footprint requires a half-turn stair core roughly 2.10 m wide instead of 1.25 m, which reshapes both floor plans. That is a separate design exercise, not an addition to this one.

---

## Revision notes, v2 → v2.1

- Bedroom 1 rebuilt: bed on the west wall, one nightstand, wardrobe on P5 with a full door swing. Bedroom 2's bed moved east to give its wardrobe 0.80 m of swing; desk moved to the south wall.
- TV unit moved north out of the D4 zone. Dining table modelled as top plus legs; chairs W and E moved out 0.15 m; chair backs defined.
- Shower tray flush in its corner; Win 1 moved west to x 0.70–1.50, out from over the screen. Shower entry moved to the west face, because the south face opens onto the washing machine.
- Handrail dimensioned, with its height measured from the nosing line through the tread nosings (the earlier formula sat 0.18 m low). Hidden in cutaway mode.
- `Touches` column added on both levels, including the wall cabinets, the shower panels and the bedroom 1 headboard, which touches two walls.
- Materials assigned to the shower screens (as glazing) and the handrail (as joinery).
- Checks 3, 5, 7 and 9 reworded or defined; checks 10 and 11 added. Tread-height wording corrected: only tread 15 rises above 2.60.
