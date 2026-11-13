# API Index

Charming offers a declarative language for drawing shapes from data on Canvas, WebGL and the terminal, and a set of utilities for working with SVG, Canvas, HTML and text directly. They can be used together or independently.

## Charming Core

Drawing shapes from data.

### [Charming Flow](/flow)

Bind data to shapes and render them.

- [_cm_.**flow**](/flow#cm-flow) — create a root flow.
- [_flow_.**renderer**](/flow#flow-renderer) — get or set the renderer.
- [_flow_.**render**](/flow#flow-render) — draw the appended shapes.
- [_flow_.**data**](/flow#flow-data) — put data into a flow.
- [_flow_.**datum**](/flow#flow-datum) — put a single datum into a flow.
- [_flow_.**append**](/flow#flow-append) — append a shape for each datum.
- [_flow_.**process**](/flow#flow-process) — prepare the data.
- [_flow_.**transform**](/flow#flow-transform) — derive attribute values.
- [_flow_.**call**](/flow#flow-call) — call a function with the flow.

### [Charming Shape](/shape)

Shapes to append to flows.

- [_cm_.**point**](/shape#cm-point) — dots.
- [_cm_.**link**](/shape#cm-link) — straight lines between two points.
- [_cm_.**line**](/shape#cm-line) — a line through the data points.
- [_cm_.**rect**](/shape#cm-rect) — rectangles.
- [_cm_.**circle**](/shape#cm-circle) — circles.
- [_cm_.**triangle**](/shape#cm-triangle) — triangles.
- [_cm_.**polygon**](/shape#cm-polygon) — polygons.
- [_cm_.**path**](/shape#cm-path) — paths from path commands.
- [_cm_.**text**](/shape#cm-text) — text.
- [_cm_.**group**](/shape#cm-group) — translate and rotate child shapes.
- [_cm_.**clear**](/shape#cm-clear) — clear the background.
- [_cm_.**constant**](/shape#cm-constant) — pass an option to a composite shape unchanged.

### [Charming Process](/process)

Prepare data before appending shapes.

- [_cm_.**each**](/process#cm-each) — call a function for each datum.
- [_cm_.**eachRight**](/process#cm-each-right) — like each, from the last datum to the first.
- [_cm_.**filter**](/process#cm-filter) — keep the matching data.
- [_cm_.**map**](/process#cm-map) — map each datum to a new one.
- [_cm_.**push**](/process#cm-push) — append a datum to each group.
- [_cm_.**derive**](/process#cm-derive) — add fields to copies of the data.

### [Charming Transform](/transform)

Derive attribute values after appending shapes.

- [_cm_.**mapAttrs**](/transform#cm-map-attrs) — map attributes with scales.
- [_cm_.**mapPosition**](/transform#cm-map-position) — map positions to the size of the renderer.

## Renderers

Draw the shapes of a flow.

### [Charming Canvas](/canvas)

Draw shapes with the Canvas 2D API.

- [_cm_.**canvas**](/canvas#cm-canvas) — create a Canvas renderer.

### [Charming WebGL](/webgl)

Draw many shapes with WebGL.

- [_cm_.**webgl**](/webgl#cm-webgl) — create a WebGL renderer.
- [_cm_.**glsl**](/webgl#cm-glsl) — define an attribute as a GLSL function.

### [Charming Terminal](/terminal)

Draw ASCII art.

- [_cm_.**terminal**](/terminal#cm-terminal) — create a terminal renderer.
- [_cm_.**figlet**](/terminal#cm-figlet) — draw text as an ASCII-art banner.

## Utilities

Work with SVG, HTML, Canvas, paths, text, vectors and noise directly.

### [Charming DOM](/dom)

Create and manipulate DOM elements.

- [_cm_.**svg**](/dom#cm-svg) — SVG via tagged template literal.
- [_cm_.**html**](/dom#cm-html) — HTML via tagged template literal.
- [_cm_.**attr**](/dom#cm-attr) — get, set, or remove attributes (including styles and events) on a node.

### [Charming Context2D](/context2d)

Set up a 2D canvas and draw shapes.

- [_cm_.**context2d**](/context2d#cm-context2d) — create a 2D canvas rendering context (size, DPR, optional container).
- [_cm_.**cssFont**](/context2d#cm-css-font) — build a CSS `font` shorthand string (canvas, DOM, or D3).
- [_cm_.**strokeLine**](/context2d#cm-stroke-line) — stroke a line between two points.
- [_cm_.**fillCircle**](/context2d#cm-fill-circle) — fill a circle.
- [_cm_.**strokeCircle**](/context2d#cm-stroke-circle) — stroke a circle.
- [_cm_.**strokeEllipse**](/context2d#cm-stroke-ellipse) — stroke an axis-aligned ellipse.
- [_cm_.**fillEllipse**](/context2d#cm-fill-ellipse) — fill an axis-aligned ellipse.

### [Charming Path](/path)

Build SVG path strings for common shapes.

- [_cm_.**pathLine**](/path#cm-path-line) — open segment `M` … `L` …
- [_cm_.**pathCircle**](/path#cm-path-circle) — closed circle.
- [_cm_.**pathRect**](/path#cm-path-rect) — closed rectangle.
- [_cm_.**pathEllipse**](/path#cm-path-ellipse) — closed axis-aligned ellipse.
- [_cm_.**pathPolygon**](/path#cm-path-polygon) — closed path through `[x, y]` points.
- [_cm_.**pathContext**](/path#cm-path-context) — a d3-path context that records path commands as arrays, for _cm_.path.

### [Charming Text](/text)

Text measurement and path-bound layout on top of [Pretext](https://github.com/chenglou/pretext).

- [_cm_.**prepare**](/text#cm-prepare) — prepare a string with font options for Pretext.
- [_cm_.**layoutTextInPath**](/text#cm-layout-text-in-path) — flow prepared text through a closed SVG path.
- [_cm_.**clearPrepareCache**](/text#cm-clear-prepare-cache) — clear memoized prepare and Pretext caches.

### [Charming Vector](/vector)

2D vectors for simulating physical laws.

- [_cm_.**vec**](/vector#cm-vec) — create a vector.
- [_cm_.**vecFromAngle**](/vector#cm-vec-from-angle) — the unit vector at an angle.
- [_cm_.**vecRandom**](/vector#cm-vec-random) — a unit vector in a random direction.
- [_cm_.**vecAdd**](/vector#cm-vec-add), [**vecSub**](/vector#cm-vec-sub), [**vecMult**](/vector#cm-vec-mult), [**vecDiv**](/vector#cm-vec-div) — arithmetic.
- [_cm_.**vecMag**](/vector#cm-vec-mag), [**vecNorm**](/vector#cm-vec-norm), [**vecClamp**](/vector#cm-vec-clamp) — magnitude.
- [_cm_.**vecDist**](/vector#cm-vec-dist), [**vecDist2**](/vector#cm-vec-dist2) — distance.
- [_cm_.**vecDot**](/vector#cm-vec-dot), [**vecCross**](/vector#cm-vec-cross), [**vecAngle**](/vector#cm-vec-angle) — products and angle.
- [_vec_.**add**](/vector#vec-add), [**mag**](/vector#vec-mag), [**norm**](/vector#vec-norm), … — the same operations as methods, in place.

### [Charming Noise](/noise)

Smooth random values for computational art.

- [_cm_.**noise**](/noise#cm-noise) — smooth, continuous random values (Perlin noise).
