# House model v3

Interactive Three.js model of a two-storey house on a 6.15 × 7.20 m plot (6.15 m along the street, 7.20 m deep) with a neighbouring building against its east wall (no ground-floor windows there; the stair runs along it as a quarter-turn flight: three steps along the front wall onto a corner landing, then the main flight north, all in steel: marble tread plates with open risers on black stringers, the landing a platform on four posts, guarded along the open sides). The first level is 8.20 m deep: it projects 1 m over the street on a cantilevered slab. Upstairs are two bedrooms and a shower room stacked over the ground-floor bathroom, off a landing at the top of the stair; the stair void runs on to the front wall as a light well with a tall window, so the street lights the flight. Both levels sit side by side as a dollhouse cutaway seen from the street side, drawn in an architectural-illustration style: section-cut walls, outlines, black-framed glazing, pinned labels, dimension lines and a lifted flat roof. Downstairs a 2.05 m strip across the back holds a WC and laundry at the west end and a galley kitchen behind a full-height sliding glass wall in black frames, three panels on a triple track, turning the corner beside the stair into a pantry column; the living room takes the remaining 4.65 m of depth. Bathing is upstairs. Windows come from a family of four types with one 2.40 m head line; the stair window is a matched pair, one per level, on the front wall. Colours and finishes follow the photos in `inspiration/`: marble-look tile downstairs, wood in the bedrooms, light oak joinery, a white kitchen.

The specification lives in the code under `src/spec/`; `scope-v3.md` is generated from it and is the document to read or hand on. The spec files are grouped in a design registry with a single entry for now, so a variant can be modelled beside the house again later. Earlier hand-written versions (`scope.md`, `scope-v2.1.md`) are superseded.

## Run

```bash
npm install
npm run dev        # local dev server
npm run build      # production bundle in dist/
npm test           # unit tests plus the Part 7 acceptance checks
npm run check      # prints the acceptance report
npm run spec-doc   # prints the spec as Markdown (redirect to scope-v3.md)
```

## Views

- **Section** (default): exterior walls facing the camera drop to 1.20 m and the rest stay full height with their windows. It follows the camera as you orbit.
- **Cutaway**: every wall at 1.20 m, as the spec's check 9 defines it.
- **Full**: the whole envelope at 2.60 m with glazing and the stair handrail.
- **Side by side** (default) shows the levels as a dollhouse; **Whole house** stacks them and seats the roof, walls always full, seen from outside.
- **Roof**, **Labels** and **Dimensions** are overlays, all off by default. Labels are the room pins and level captions; Dimensions are the outer edge lines and a tag in every room, the stair void included, with its name, width × depth and area.
- **العربية / English** switches the whole interface, including pins and tags, with right-to-left layout. Numbers stay Latin digits in both.
- The camera fits itself to whatever is visible: both levels on load and reset, a single level when you pick one. The viewport grows with the window height.

The initial view can be set from the URL, e.g. `?levels=first&mode=full&layout=assembled&roof=1&labels=1&dimensions=1&lang=ar`; `azimuth` and `polar` (radians) set the camera, so `?layout=assembled&azimuth=0&polar=1.45` is a near-elevation of the street front.

## Layout

- `src/spec/` — the specification as data: global dimensions, both levels, the stair; `presentation.js` holds the illustration settings.
- `src/model/` — pure geometry: wall splitter, stair, furniture, floors, roof, section cut, annotations. No Three.js.
- `src/checks/` — the eleven acceptance checks from Part 7, run on the model.
- `src/scene/` — Three.js: materials, mesh building, DOM labels, viewer, toolbar.
- `tests/` — Vitest suites for the splitter, the model, the presentation layer and the acceptance checks.

The scene draws exactly what the checks measure: both read the same model objects. Dressing pieces (pillows, worktop, door leaves and so on) are rendered only and never measured.
