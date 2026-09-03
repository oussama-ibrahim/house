# House model v3

Interactive Three.js model of a 6 × 6 m two-storey house on a site with a neighbouring building against its east wall (no ground-floor windows there; the stair runs along it). Both levels sit side by side as a dollhouse cutaway seen from the street side, drawn in an architectural-illustration style: section-cut walls, outlines, black-framed glazing, pinned labels, dimension lines and a lifted flat roof. Colours and finishes follow the photos in `inspiration/`: marble-look tile downstairs, wood in the bedrooms, light oak joinery, a white kitchen behind a black-framed glass screen.

The specification lives in the code under `src/spec/`; `scope-v3.md` is generated from it and is the document to read or hand on. Earlier hand-written versions (`scope.md`, `scope-v2.1.md`) are superseded.

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
- **Roof**, **Labels** and **Dimensions** are overlays, all off by default. Labels are the room pins and level captions; Dimensions are the 6 m edge lines and a tag in every room with its name, width × depth and net area.
- **العربية / English** switches the whole interface, including pins and tags, with right-to-left layout. Numbers stay Latin digits in both.
- The camera fits itself to whatever is visible: both levels on load and reset, a single level when you pick one. The viewport grows with the window height.

The initial view can be set from the URL, e.g. `?levels=first&mode=full&layout=assembled&roof=1&labels=1&dimensions=1&lang=ar`.

## Layout

- `src/spec/` — the specification as data: global dimensions, both levels, the stair; `presentation.js` holds the illustration settings.
- `src/model/` — pure geometry: wall splitter, stair, furniture, floors, roof, section cut, annotations. No Three.js.
- `src/checks/` — the eleven acceptance checks from Part 7, run on the model.
- `src/scene/` — Three.js: materials, mesh building, DOM labels, viewer, toolbar.
- `tests/` — Vitest suites for the splitter, the model, the presentation layer and the acceptance checks.

The scene draws exactly what the checks measure: both read the same model objects. Dressing pieces (pillows, worktop, door leaves and so on) are rendered only and never measured.
