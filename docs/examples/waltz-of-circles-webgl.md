# Waltz of Circles, WebGL

The same circles drawn with the [WebGL renderer](/webgl), which batches them into one draw call, so it handles many more. The attributes are still computed in JavaScript. A reimplementation of Ricky Reusser's [Instanced WebGL Circles](https://observablehq.com/@rreusser/instanced-webgl-circles). Compare with the [Canvas](/examples/waltz-of-circles-canvas) and [GLSL](/examples/waltz-of-circles-glsl) versions.

```js eval code=false
const count = Inputs.range([1000, 50000], {label: "Circles", step: 1000, value: 10000});
```

```js eval t=example
const width = 640;
const height = 640;
const theta = Array.from({length: count}, (_, i) => (i / count) * Math.PI * 2);
const renderer = cm.webgl({width, height});
const root = cm.flow().renderer(renderer);
let time = 0;

requestAnimationFrame(function frame() {
  time += 0.02;
  const dist = (d) => 0.6 + 0.2 * Math.cos(d * 6.0 + Math.cos(d * 8.0 + time));

  root.append(cm.clear, {fill: "black"});
  root
    .data(theta)
    .append(cm.circle, {
      x: (d) => Math.cos(d) * dist(d),
      y: (d) => Math.sin(d) * dist(d),
      r: (d) => 0.2 + 0.12 * Math.cos(d * 9.0 - time * 2.0),
      stroke: (d) => {
        const th = 8.0 * d + time * 2.0;
        const r = 0.6 + 0.4 * Math.cos(th);
        const g = 0.6 + 0.4 * Math.cos(th - Math.PI / 3);
        const b = 0.6 + 0.4 * Math.cos(th - (Math.PI * 2.0) / 3.0);
        return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
      },
      strokeOpacity: (0.15 * 2000) / count,
    })
    .transform(cm.mapPosition, {padding: 100})
    .transform(cm.mapAttrs, {r: {range: [24, 96]}});

  root.render();
  requestAnimationFrame(frame);
});

document.body.append(renderer.node());
```
