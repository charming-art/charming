# Charming Transform

**Charming Transform** provides functions for [_flow_.transform](/flow#flow-transform), which derive the final attribute values of the shapes just appended, such as mapping abstract values to positions and colors.

```js eval code=false
(() => {
  const data = Array.from({length: 60}, (_, i) => ({x: i, y: Math.sin(i / 6) * (i + 10), r: i}));
  const renderer = cm.canvas({width: 640, height: 200});
  const root = cm.flow().renderer(renderer);

  root
    .data(data)
    .append(cm.circle, {x: (d) => d.x, y: (d) => d.y, r: (d) => d.r, fill: (d) => d.r, fillOpacity: 0.7})
    .transform(cm.mapPosition, {padding: 20, reverseY: true})
    .transform(cm.mapAttrs, {r: {range: [2, 10]}, fill: {interpolate: (t) => `hsl(${200 + t * 120}, 70%, 50%)`}});

  root.render();

  return renderer.node();
})();
```

```js
root
  .data(data)
  .append(cm.circle, {
    x: (d) => d.x,
    y: (d) => d.y,
    r: (d) => d.r,
    fill: (d) => d.r,
    fillOpacity: 0.7,
  })
  .transform(cm.mapPosition, {padding: 20, reverseY: true})
  .transform(cm.mapAttrs, {
    r: {range: [2, 10]},
    fill: {interpolate: (t) => `hsl(${200 + t * 120}, 70%, 50%)`},
  });
```

A transform is a function called with the flow, the appended values and the parameters passed to _flow_.transform, and returns the new values.

## _cm_.mapAttrs {#cm-map-attrs}

Maps attributes with scales. Each key names an attribute, and its options define the scale:

- **scale** — the scale, such as [_cm_.scaleLinear](/scale#cm-scale-linear) (default) or [_cm_.scaleOrdinal](/scale#cm-scale-ordinal). A [d3-scale](https://d3js.org/d3-scale) constructor such as `d3.scaleLog` works too.
- **domain** — the input values, inferred from the data by default: the extent for continuous scales, the distinct values for ordinal ones.
- **range** — the output values (default `[0, 1]`).
- **interpolate** — for continuous scales, a function that maps a normalized value between 0 and 1 to an output, such as a color.

Attributes without options are left unchanged.

```js
root
  .data(data)
  .append(cm.circle, {x: (d) => d.x, y: (d) => d.y, r: (d) => d.value})
  .transform(cm.mapAttrs, {
    r: {range: [2, 10]},
  });
```

## _cm_.mapPosition {#cm-map-position}

Maps position attributes to the size of the renderer: the x attributes to `[0, width]` and the y attributes to `[0, height]`. It's like [_cm_.mapAttrs](#cm-map-attrs) for positions. Options:

- **scaleX**, **scaleY** — the scales (default [_cm_.scaleLinear](/scale#cm-scale-linear)).
- **domainX**, **domainY** — the input values, inferred from the data by default.
- **padding** — space between the shapes and the edges (default `0`).
- **reverseX**, **reverseY** — whether to reverse the range (default `false`). Use `reverseY: true` to put larger y values at the top.
- **keysX**, **keysY** — the attributes to map (default `["x", "x1"]` and `["y", "y1"]`).

It needs the flow's [renderer](/flow#flow-renderer) to be set.

```js
root
  .data(data)
  .append(cm.circle, {x: (d) => d.x, y: (d) => d.y, r: 4})
  .transform(cm.mapPosition, {padding: 20, reverseY: true});
```
