# Clover Rainbow

A clover curve drawn with 120 circles, whose radii and colors come from the same parameter. [_cm_.mapAttrs](/transform#cm-map-attrs) maps it to sizes and to a rainbow.

```js eval t=example
const renderer = cm.canvas({width: 640, height: 640});
const root = cm.flow().renderer(renderer);

root
  .data(Array.from({length: 120}, (_, i) => (i * Math.PI) / 120))
  .append(cm.circle, {
    x: (t) => Math.cos(t) * Math.cos(t * 3),
    y: (t) => Math.sin(t) * Math.cos(t * 3),
    r: (t) => t,
    fill: (t) => t,
  })
  .transform(cm.mapPosition, {padding: 30})
  .transform(cm.mapAttrs, {
    r: {range: [8, 15]},
    fill: {interpolate: d3.interpolateRainbow},
  });

root.render();

document.body.append(renderer.node());
```
