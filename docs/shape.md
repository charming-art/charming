# Charming Shape

**Charming Shape** provides the shapes that [_flow_.append](/flow#flow-append) draws: one shape instance per datum, with each attribute set from an option. Positions are in pixels, or in cells with the [terminal renderer](/terminal).

These are the standard appearance attributes. Each shape lists which of them it supports:

- **fill** — the fill color.
- **fillOpacity** — the fill opacity, a number between 0 and 1.
- **stroke** — the stroke color.
- **strokeWidth** — the stroke width in pixels.
- **strokeOpacity** — the stroke opacity, a number between 0 and 1.

```js eval code=false
(() => {
  const renderer = cm.canvas({width: 640, height: 120});
  const root = cm.flow().renderer(renderer);

  root.append(cm.circle, {x: 60, y: 60, r: 40, fill: "steelblue"});
  root.append(cm.rect, {x: 130, y: 20, width: 80, height: 80, fill: "orange"});
  root.append(cm.triangle, {x: 240, y: 100, x1: 320, y1: 100, x2: 280, y2: 20, fill: "seagreen"});
  root.append(cm.link, {x: 350, y: 100, x1: 430, y1: 20, stroke: "black", strokeWidth: 4});
  root
    .data([460, 490, 520, 550, 580, 610])
    .append(cm.line, {x: (d) => d, y: (_, i) => (i % 2 ? 30 : 90), stroke: "crimson", strokeWidth: 2});

  root.render();

  return renderer.node();
})();
```

## _cm_.point {#cm-point}

Appends dots at _x_ and _y_. It supports:

- **x** — the horizontal position.
- **y** — the vertical position.
- **stroke**, **strokeWidth** — the color and size of the dot.

```js
root.append(cm.point, {x: 10, y: 10});
```

On the terminal renderer, a point is one cell. See [cells](/terminal#cells).

## _cm_.link {#cm-link}

Appends straight lines from (_x_, _y_) to (_x1_, _y1_). It supports:

- **x**, **y** — the start point.
- **stroke**, **strokeWidth** — the color and width of the line.
- **x1**, **y1** — the end point.
- **rotate** — the rotation angle in radians, clockwise.
- **transformOrigin** — the point to rotate around: `"start"` (default), `"center"` or `"end"`.
- **strokeCap** — the shape of the end points: `"butt"` (default), `"round"` or `"square"`.

```js eval code=false
(() => {
  const renderer = cm.canvas({width: 320, height: 120});
  const root = cm.flow().renderer(renderer);

  root.data(["butt", "round", "square"]).append(cm.link, {
    x: 40,
    y: (_, i) => 30 + i * 30,
    x1: 280,
    y1: (_, i) => 30 + i * 30,
    stroke: "steelblue",
    strokeWidth: 16,
    strokeCap: (d) => d,
  });

  root.render();

  return renderer.node();
})();
```

```js
root.data(["butt", "round", "square"]).append(cm.link, {
  x: 40,
  y: (_, i) => 30 + i * 30,
  x1: 280,
  y1: (_, i) => 30 + i * 30,
  stroke: "steelblue",
  strokeWidth: 16,
  strokeCap: (d) => d,
});
```

## _cm_.line {#cm-line}

Appends a line through the _x_ and _y_ of every datum of a group. It supports:

- **x**, **y** — the position of each point.
- **stroke**, **strokeWidth** — the color and width of the line, taken from the first datum.
- **close** — whether to close the line (default `false`).

```js eval code=false
(() => {
  const renderer = cm.canvas({width: 320, height: 120});
  const root = cm.flow().renderer(renderer);

  root
    .data(Array.from({length: 40}, (_, i) => i))
    .append(cm.line, {x: (d) => 10 + d * 7.5, y: (d) => 60 + Math.sin(d / 3) * 40, stroke: "black", strokeWidth: 2});

  root.render();

  return renderer.node();
})();
```

```js
root.data(Array.from({length: 40}, (_, i) => i)).append(cm.line, {
  x: (d) => 10 + d * 7.5,
  y: (d) => 60 + Math.sin(d / 3) * 40,
  stroke: "black",
  strokeWidth: 2,
});
```

## _cm_.rect {#cm-rect}

Appends rectangles at _x_ and _y_ with _width_ and _height_. In addition to the [standard attributes](#charming-shape), it supports:

- **x**, **y** — the position of the top-left corner, or of the center with `anchor: "center"`.
- **width**, **height** — the size.
- **anchor** — `"start"` (default) or `"center"`.
- **rotate** — the rotation angle in radians, clockwise, around the center.

```js eval code=false
(() => {
  const renderer = cm.canvas({width: 320, height: 120});
  const root = cm.flow().renderer(renderer);

  root.append(cm.rect, {x: 20, y: 20, width: 120, height: 80, fill: "orange"});
  root.append(cm.rect, {
    x: 240,
    y: 60,
    width: 60,
    height: 60,
    anchor: "center",
    rotate: Math.PI / 4,
    fill: "steelblue",
  });

  root.render();

  return renderer.node();
})();
```

```js
root.append(cm.rect, {x: 20, y: 20, width: 120, height: 80, fill: "orange"});
root.append(cm.rect, {
  x: 240,
  y: 60,
  width: 60,
  height: 60,
  anchor: "center",
  rotate: Math.PI / 4,
  fill: "steelblue",
});
```

## _cm_.circle {#cm-circle}

Appends circles at _x_ and _y_ with radius _r_. In addition to the [standard attributes](#charming-shape), it supports:

- **x**, **y** — the center.
- **r** — the radius.

```js
root.append(cm.circle, {x: 50, y: 50, r: 30, fill: "steelblue"});
```

## _cm_.triangle {#cm-triangle}

Appends triangles through (_x_, _y_), (_x1_, _y1_) and (_x2_, _y2_). It supports:

- **x**, **y**, **x1**, **y1**, **x2**, **y2** — the three corners.
- **fill**, **stroke**, **strokeWidth** — the colors and stroke width.

```js
root.append(cm.triangle, {x: 0, y: 0, x1: 10, y1: 0, x2: 10, y2: 10, fill: "seagreen"});
```

## _cm_.polygon {#cm-polygon}

Appends polygons through points. In addition to the [standard attributes](#charming-shape), it supports:

- **x**, **y** — the positions of the points.

When each datum is a point, the group's data draws one polygon:

```js eval code=false
(() => {
  const renderer = cm.canvas({width: 320, height: 120});
  const root = cm.flow().renderer(renderer);

  root
    .data(Array.from({length: 6}, (_, i) => (i / 6) * Math.PI * 2))
    .append(cm.polygon, {x: (t) => 160 + Math.cos(t) * 50, y: (t) => 60 + Math.sin(t) * 50, fill: "steelblue"});

  root.render();

  return renderer.node();
})();
```

```js
root.data(Array.from({length: 6}, (_, i) => (i / 6) * Math.PI * 2)).append(cm.polygon, {
  x: (t) => 160 + Math.cos(t) * 50,
  y: (t) => 60 + Math.sin(t) * 50,
  fill: "steelblue",
});
```

When each datum holds arrays of positions, each datum draws a polygon:

```js
const polygons = [
  {x: [0, 10, 10], y: [0, 0, 10]},
  {x: [20, 30, 30], y: [0, 0, 10]},
];

root.data(polygons).append(cm.polygon, {x: (d) => d.x, y: (d) => d.y});
```

## _cm_.path {#cm-path}

Appends paths defined by _d_. In addition to the [standard attributes](#charming-shape), it supports:

- **d** — an array of path commands such as `[["M", 0, 0], ["L", 10, 0], ["Z"]]`, or a path string.
- **x**, **y** — an offset for the path (default `0`).

[_cm_.pathContext](/path#cm-path-context) builds command arrays with the [d3-path](https://d3js.org/d3-path) API, so a d3-shape or d3-geo path can be drawn without parsing a string.

```js eval code=false
(() => {
  const renderer = cm.canvas({width: 320, height: 120});
  const root = cm.flow().renderer(renderer);

  root.append(cm.path, {
    d: () => {
      const context = cm.pathContext();
      context.moveTo(20, 100);
      context.bezierCurveTo(100, -20, 220, 220, 300, 20);
      return context.toArray();
    },
    stroke: "black",
    strokeWidth: 2,
  });

  root.render();

  return renderer.node();
})();
```

```js
root.append(cm.path, {
  d: () => {
    const context = cm.pathContext();
    context.moveTo(20, 100);
    context.bezierCurveTo(100, -20, 220, 220, 300, 20);
    return context.toArray();
  },
  stroke: "black",
  strokeWidth: 2,
});
```

## _cm_.text {#cm-text}

Appends text at _x_ and _y_. In addition to the [standard attributes](#charming-shape), it supports:

- **text** — the text content.
- **x**, **y** — the position.
- **fontSize** — the font size in pixels (default `14`).
- **fontFamily** — the font family.
- **fontWeight** — the font weight (default `"normal"`).
- **textAlign** — the horizontal alignment: `"start"`, `"center"` or `"end"`.
- **textBaseline** — the vertical alignment, such as `"top"`, `"middle"` or `"bottom"`.

```js eval code=false
(() => {
  const renderer = cm.canvas({width: 320, height: 80});
  const root = cm.flow().renderer(renderer);

  root.append(cm.text, {
    text: "Charming",
    x: 160,
    y: 40,
    fontSize: 36,
    fontFamily: "sans-serif",
    fontWeight: "bold",
    textAlign: "center",
    textBaseline: "middle",
    fill: "orange",
    stroke: "black",
  });

  root.render();

  return renderer.node();
})();
```

```js
root.append(cm.text, {
  text: "Charming",
  x: 160,
  y: 40,
  fontSize: 36,
  fontFamily: "sans-serif",
  fontWeight: "bold",
  textAlign: "center",
  textBaseline: "middle",
  fill: "orange",
  stroke: "black",
});
```

## _cm_.group {#cm-group}

Appends groups, which translate and rotate the shapes appended to them. It supports:

- **x**, **y** — the translation.
- **rotate** — the rotation angle in radians, clockwise.

The shapes appended to a group are drawn once for each datum of the group.

```js eval code=false
(() => {
  const renderer = cm.canvas({width: 320, height: 120});
  const root = cm.flow().renderer(renderer);

  root
    .data([0, 1, 2, 3])
    .append(cm.group, {x: (d) => 40 + d * 80, y: 60, rotate: (d) => (d * Math.PI) / 8})
    .append(cm.rect, {x: 0, y: 0, width: 40, height: 40, anchor: "center", fill: "steelblue"});

  root.render();

  return renderer.node();
})();
```

```js
root
  .data([0, 1, 2, 3])
  .append(cm.group, {x: (d) => 40 + d * 80, y: 60, rotate: (d) => (d * Math.PI) / 8})
  .append(cm.rect, {x: 0, y: 0, width: 40, height: 40, anchor: "center", fill: "steelblue"});
```

## _cm_.clear {#cm-clear}

Clears the canvas with the specified color. It supports:

- **fill** — the clear color.

```js
root.append(cm.clear, {fill: "black"});
```

## Composite shapes

A shape can also be a function. It's called with a flow (_flow_) and the evaluated attribute values (_value_), and appends built-in shapes to the flow. Each value is an array with one entry per datum, so a composite shape can compute its parts from them. Composite shapes can be appended and transformed like built-in shapes.

For example, an arrow made of three links, used to draw a flow field:

```js eval code=false
(() => {
  function arrow(flow, {length, angle, x, y, rotate, stroke}) {
    const group = flow.append(cm.group, {x, y, rotate});
    const l1 = length.map((d) => d / 2);
    const l2 = length.map((d) => -d / 2);
    group.append(cm.link, {x: l2, y: 0, x1: l1, y1: 0, stroke});
    group.append(cm.link, {x: 0, y: 0, x1: l1, y1: 0, rotate: angle, transformOrigin: "end", stroke});
    group.append(cm.link, {x: 0, y: 0, x1: l1, y1: 0, rotate: -angle, transformOrigin: "end", stroke});
  }

  const size = 16;
  const noise = cm.noise();
  const fields = Array.from({length: 40 * 15}, (_, i) => {
    const x = i % 40;
    const y = (i / 40) | 0;
    return {x, y, value: noise(y * 0.1, x * 0.1)};
  });

  const renderer = cm.canvas({width: 640, height: 240});
  const root = cm.flow().renderer(renderer);

  root
    .data(fields)
    .append(arrow, {
      x: (d) => d.x * size + size / 2,
      y: (d) => d.y * size + size / 2,
      length: size * 0.8,
      angle: cm.constant(Math.PI / 6),
      rotate: (d) => d.value,
      stroke: "black",
    })
    .transform(cm.mapAttrs, {rotate: {domain: [0, 1], range: [0, Math.PI * 2]}});

  root.render();

  return renderer.node();
})();
```

```js
function arrow(flow, {length, angle, x, y, rotate, ...options}) {
  const group = flow.append(cm.group, {x, y, rotate});
  const l1 = length.map((d) => d / 2);
  const l2 = length.map((d) => -d / 2);
  group.append(cm.link, {x: l2, y: 0, x1: l1, y1: 0, ...options});
  group.append(cm.link, {x: 0, y: 0, x1: l1, y1: 0, rotate: angle, transformOrigin: "end", ...options});
  group.append(cm.link, {x: 0, y: 0, x1: l1, y1: 0, rotate: -angle, transformOrigin: "end", ...options});
}

root
  .data(fields)
  .append(arrow, {
    x: (d) => d.x * size + size / 2,
    y: (d) => d.y * size + size / 2,
    length: size * 0.8,
    angle: cm.constant(Math.PI / 6),
    rotate: (d) => d.value,
    stroke: "black",
  })
  .transform(cm.mapAttrs, {rotate: {domain: [0, 1], range: [0, Math.PI * 2]}});
```

## _cm_.constant(_value_) {#cm-constant}

Marks an option as a constant: a [composite shape](#composite-shapes) receives _value_ as is, instead of an array with one entry per datum. Use it for options that aren't data-driven.

```js
root.data(["A", "B", "C"]).append(bar, {
  x: (d) => d,
  axis: cm.constant(false),
  colors: cm.constant(["yellow", "red"]),
});

function bar(flow, {x, axis, colors}) {
  x; // ["A", "B", "C"]
  axis; // false
  colors; // ["yellow", "red"]
}
```
