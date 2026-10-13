# Charming Path

**Charming Path** builds SVG [`d`](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d) path strings from numbers, handy for `<path>`, [`getPointAtLength`](https://developer.mozilla.org/en-US/docs/Web/API/SVGGeometryElement/getPointAtLength), or APIs such as `layoutTextInPath` that expect a path description. Shapes are axis-aligned in user space (no rotation in the path itself). [_cm_.pathContext](#cm-path-context) records paths as command arrays for [_cm_.path](/shape#cm-path).

```js eval code=false
(() => {
  const d = cm.pathCircle(100, 100, 80);
  return cm.svg`<svg ${{width: 200, height: 200}}>
    <path ${{fill: "none", stroke: "black", stroke_width: 2, d}} />
  </svg>`;
})();
```

```js
const d = cm.pathCircle(100, 100, 80);

cm.svg`<svg ${{width: 200, height: 200}}>
  <path ${{fill: "none", stroke: "black", stroke_width: 2, d}} />
</svg>`;
```

## _cm_.pathLine(_x1_, _y1_, _x2_, _y2_) {#cm-path-line}

Returns an **open** path: `M` to (_x1_, _y1_), `L` to (_x2_, _y2_).

```js eval code=false
(() => {
  const d = cm.pathLine(10, 90, 90, 10);
  return cm.svg`<svg ${{width: 100, height: 100, viewBox: "0 0 100 100"}}>
    <path ${{fill: "none", stroke: "steelblue", stroke_width: 2, d}} />
  </svg>`;
})();
```

```js
const d = cm.pathLine(10, 90, 90, 10);
```

## _cm_.pathCircle(_cx_, _cy_, _r_) {#cm-path-circle}

Returns a **closed** circle centered at (_cx_, _cy_) with radius _r_, using two arc segments.

```js eval code=false
(() => {
  const d = cm.pathCircle(50, 50, 40);
  return cm.svg`<svg ${{width: 100, height: 100, viewBox: "0 0 100 100"}}>
    <path ${{fill: "none", stroke: "teal", stroke_width: 2, d}} />
  </svg>`;
})();
```

```js
const d = cm.pathCircle(100, 100, 50);
```

## _cm_.pathRect(_x_, _y_, _width_, _height_) {#cm-path-rect}

Returns a **closed** rectangle with top-left (_x_, _y_) and size _width_ × _height_.

```js eval code=false
(() => {
  const d = cm.pathRect(15, 25, 70, 50);
  return cm.svg`<svg ${{width: 100, height: 100, viewBox: "0 0 100 100"}}>
    <path ${{fill: "none", stroke: "purple", stroke_width: 2, d}} />
  </svg>`;
})();
```

```js
const d = cm.pathRect(0, 0, 100, 50);
```

## _cm_.pathEllipse(_cx_, _cy_, _rx_, _ry_) {#cm-path-ellipse}

Returns a **closed** axis-aligned ellipse centered at (_cx_, _cy_) with radii _rx_ and _ry_, using two elliptical arcs.

```js eval code=false
(() => {
  const d = cm.pathEllipse(50, 50, 42, 28);
  return cm.svg`<svg ${{width: 100, height: 100, viewBox: "0 0 100 100"}}>
    <path ${{fill: "none", stroke: "coral", stroke_width: 2, d}} />
  </svg>`;
})();
```

```js
const d = cm.pathEllipse(100, 100, 60, 40);
```

## _cm_.pathPolygon(_points_) {#cm-path-polygon}

Returns a **closed** path through _points_, an array of `[x, y]` pairs. The first point is moved to with `M`; later points use `L`; the path ends with `Z`.

```js eval code=false
(() => {
  const d = cm.pathPolygon([
    [50, 10],
    [90, 90],
    [10, 90],
  ]);
  return cm.svg`<svg ${{width: 100, height: 100, viewBox: "0 0 100 100"}}>
    <path ${{fill: "none", stroke: "darkgreen", stroke_width: 2, d}} />
  </svg>`;
})();
```

```js
const d = cm.pathPolygon([
  [0, 0],
  [100, 0],
  [50, 80],
]);
```

## _cm_.pathContext() {#cm-path-context}

Returns a [d3-path](https://d3js.org/d3-path)-compatible context that records path commands as arrays instead of a string. Call the [CanvasPathMethods](https://html.spec.whatwg.org/multipage/canvas.html#canvaspath) on it (_moveTo_, _lineTo_, _quadraticCurveTo_, _bezierCurveTo_, _arc_, _arcTo_, _rect_, _closePath_), then _context_.toArray() to get the commands. Pass them as the **d** of [_cm_.path](/shape#cm-path), so a path from [d3-shape](https://d3js.org/d3-shape) or [d3-geo](https://d3js.org/d3-geo) can be drawn without parsing a string.

```js
const context = cm.pathContext();
context.moveTo(0, 0);
context.lineTo(10, 0);
context.lineTo(10, 10);
context.closePath();
context.toArray(); // [["M", 0, 0], ["L", 10, 0], ["L", 10, 10], ["Z"]]
```

For example, with d3-geo:

```js
const path = d3.geoPath(d3.geoOrthographic());

root.append(cm.path, {
  d: () => {
    const context = cm.pathContext();
    path.context(context)(d3.geoCircle()());
    return context.toArray();
  },
  stroke: "black",
});
```
