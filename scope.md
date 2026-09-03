# 3D house model — spec v2.1 patch

Apply on top of v2. Everything in v2 stands except the items below. Together, v2 + this patch is the specification.

Three changes go beyond what the review asked for. They are marked **[extended]** and are explained where they appear: the bedroom 1 layout is rebuilt rather than patched, bedroom 2's bed shifts east for the same reason, and the shower tray moves to sit flush in its corner.

---

## 1 — Ground level furniture, replacement rows

Replace these rows in the Part 4 furniture table. A `Touches` column is added; check 5 exempts any face listed there.

| Piece | w × d × h | Centre (x, z) | Touches |
|---|---|---|---|
| TV unit | 0.40 × 1.30 × 0.50 | 4.25, 4.05 | P3 face x 4.45 |
| Dining table top | 1.30 × 0.80 × 0.05 | 2.80, 3.05 | — |
| Dining table legs ×4 | 0.07 × 0.07 × 0.70 | see below | — |
| Chair W | 0.45 × 0.45 × 0.45 | 1.90, 3.05 | — |
| Chair E | 0.45 × 0.45 × 0.45 | 3.70, 3.05 | — |
| Chair S | 0.45 × 0.45 × 0.45 | 2.80, 3.85 | — |
| Shower tray | 0.90 × 0.90 × 0.08 | 2.05, 0.65 | north wall face z 0.20, P2 face x 2.50 |
| Shower screen, west panel | 0.02 × 0.90 × 1.90 | 1.60, 0.65 | — |
| Shower screen, south panel | 0.40 × 0.02 × 1.90 | 1.80, 1.10 | — |

**TV unit.** Now spans z 3.40–4.70, clearing the D4 zone by 0.10 m and still facing the sofa.

**Dining table.** Model as a top plus four legs, not one solid box, so the chairs can tuck. Top underside at y 0.70, top surface at 0.75. Leg centres inset 0.08 m from the top's corners: (2.265, 2.735), (3.335, 2.735), (2.265, 3.365), (3.335, 3.365). Chairs W and E have moved out 0.15 m and now clear the nearest legs by 0.10 m and 0.04 m.

**Chair backs.** Each back is a 0.45 × 0.08 × 0.45 box sitting on the seat at y 0.45, on the face away from the table: chair W's back on its west face, chair E's on its east face, chair S's on its south face.

**Shower.** The tray moves 0.05 m north and east to sit flush in its corner **[extended]** — in v2 it floated 0.05 m off both walls, which reads as a modelling error rather than a design choice. New extent x 1.60–2.50, z 0.20–1.10. The west screen panel now stands at x 1.60, and with Win 1 moved (item 2) it clears the window prism by 0.10 m. The south panel runs x 1.60–2.00 only, leaving a 0.50 m entry at x 2.00–2.50. Screen thickness 0.02, height 1.90.

Nightstands are on the first level, not this one — see item 4.

---

## 2 — Win 1 moves west

| Ref | Wall | Position | Width | Sill | Head |
|---|---|---|---|---|---|
| Win 1 bathroom | north, z 0.10 | **x 0.70 – 1.50** | 0.80 | 1.40 | 2.20 |

This takes the window out from over the shower screen. The basin at x 0.25–0.85 now sits partly under it, which is fine: the basin tops out at 0.85, well below the 1.40 sill.

---

## 3 — Handrail, dimensioned

| Item | Value |
|---|---|
| Section | 0.05 × 0.05 |
| Wall offset | 0.05 from the east wall face, so centreline at x 5.725 |
| Extent | z 5.55 to z 2.30 |
| Height | 0.90 above the nosing line, i.e. `y = 0.72 × (5.80 − z) + 0.90` |

Model it as a single box rotated about the X axis to the pitch angle, `atan(0.18 / 0.25)` = 0.6245 rad.

The rail crosses in front of Win 6 between z 5.38 and z 4.80, rising from 1.20 to 1.62 m while the sill is at 1.20. That is ordinary construction — a 50 mm handrail passing a stair window is not an obstruction. **Exempt the handrail from check 7 explicitly** rather than moving the window, since every alternative position either buries the window or puts the rail over the open side of the flight.

---

## 4 — Bedroom 1, rebuilt **[extended]**

The review flagged that the wardrobe doors cannot open, and left it to me. Patching the wardrobe alone does not work — every position that clears the bed either blocks the D6 zone or leaves under 0.40 m of swing. Moving the bed to the west wall frees the whole south wall, so the wardrobe gets a full swing and the room gains a clear 1.55 m circulation strip. Replace all bedroom 1 furniture rows with:

| Piece | w × d × h | Centre (x, z) | Touches |
|---|---|---|---|
| Double bed | 1.60 × 2.00 × 0.50 | 1.00, 1.32 | west wall face x 0.20 |
| Headboard | 1.60 × 0.12 × 0.50 | 1.00, 0.26 | north wall face z 0.20 |
| Nightstand | 0.40 × 0.40 × 0.45 | 2.10, 0.45 | — |
| Wardrobe | 1.20 × 0.60 × 2.10 | 2.55, 2.90 | P5 face z 3.20 |

Bed extent x 0.20–1.80, z 0.32–2.32. Wardrobe extent x 1.95–3.15, z 2.60–3.20 — no overlap in x with the bed, so the doors swing north into open floor. One nightstand only; the bed's west side is against the wall.

Bed top at 0.50 is below Win 8's 0.90 sill, so it does not enter the window prism.

---

## 5 — Bedroom 2 and the desk

| Piece | w × d × h | Centre (x, z) | Touches |
|---|---|---|---|
| Bed | 1.40 × 1.90 × 0.50 | 2.30, 4.73 | — |
| Headboard | 1.50 × 0.12 × 0.50 | 2.30, 5.74 | south wall face z 5.80 |
| Wardrobe | 0.60 × 1.20 × 2.10 | 0.50, 4.00 | west wall face x 0.20 |
| Desk | 1.10 × 0.55 × 0.74 | 3.70, 5.525 | south wall face z 5.80 |

**Bed.** Centre z is now 4.73 exactly, so the extent z 3.78–5.68 meets the headboard at 5.68 with no overlap. It also moves east to x 1.60–3.00 **[extended]**, because at the v2 position the wardrobe had only 0.40 m of door swing — the same fault the review found in bedroom 1. The gap is now 0.80 m.

**Desk.** Against the south wall as the review proposed, shifted a further 0.15 m east to x 3.15–4.25 so it clears the relocated bed. It clears Win 11 (x 1.20–2.80), P6 (face x 4.45) and the D7 zone, and its top face is unobstructed from the default camera.

---

## 6 — Corrected wording

**Tread heights.** There are 15 treads. Only tread 15 rises above the 2.60 m wall height, topping out at 2.70 inside the slab zone. Tread 14 stops at 2.52. The v2 sentence naming "treads 15 and 16" is wrong — riser 16 is the final step onto the upper floor, not a tread.

**Check 3, reworded.** Assert that the ground-level stair room, x 4.55–5.80 and z 2.05–5.80, lies entirely within the first level's stair void, which occupies the same extent. Separately assert that the first level's landing, x 4.55–5.80 and z 0.20–2.05, sits over the east end of the ground-level kitchen. The v2 wording conflated the two and did not match the room tables.

**Check 5, amended.** A furniture box may touch a wall face only where the `Touches` column says so. Elsewhere the minimum gap is 0.05 m.

**Check 7, amended.** Transparent elements — glazing, shower screens, the handrail — are exempt. The kitchen base run under Win 2 remains exempt as already stated.

**Check 9, defined.** Sample a 5 × 5 grid of points on each piece's top face. Cast a ray from each point to the camera. Occluders are wall boxes, slab boxes and tread boxes only — not other furniture. Run it in cutaway mode at the default camera. Assert 60 % or more of the sample points are unobstructed for: kitchen base run, fridge, sofa, both beds, desk. In full-height mode most pieces fail this, which is expected and is why cutaway is the default.

**Wall splitter.** An opening may sit flush against the end of its wall — D4 runs to the south wall face. The splitter must emit a zero-length pier without erroring or producing a degenerate box.

---

## 7 — Re-run these

Beyond the full check list, these five are the ones this patch touches:

1. TV unit does not intersect the D4 clear zone.
2. Desk does not intersect the D7 clear zone, and passes check 9.
3. No shower screen panel intersects the Win 1 prism.
4. Every furniture-to-wall contact appears in a `Touches` column.
5. In both bedrooms, the clear distance in front of each wardrobe, over its full width, is at least 0.60 m.