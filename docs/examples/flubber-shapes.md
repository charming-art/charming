# Jiggly Shapes, flubber

Nested shapes that jiggle, change colors and morph into another shape every two seconds. [flubber](https://github.com/veltman/flubber) interpolates between the [d3-shape symbols](https://d3js.org/d3-shape/symbol), [d3-ease](https://d3js.org/d3-ease) gives the elastic motion, and Charming draws each frame as [paths](/shape#cm-path). After Paul Buffa's [Jiggly Map](https://observablehq.com/@pstuffa/jiggly-map).

```js eval t=example
const size = 640;
const radii = d3.range(150, 4, -15);
const random = d3.randomUniform(-25, 25);
const schemes = [
  "Viridis",
  "Inferno",
  "Magma",
  "Plasma",
  "Warm",
  "Cool",
  "Rainbow",
  "Blues",
  "Greens",
  "Oranges",
  "Purples",
  "Reds",
  "PuRd",
  "YlGnBu",
];
const symbols = [d3.symbolCircle, d3.symbolSquare, d3.symbolDiamond2, d3.symbolCross, d3.symbolStar, d3.symbolWye];
const color = (scheme) => d3.scaleSequential([150, 0], d3[`interpolate${scheme}`]);
const shape = (symbol, r) => d3.symbol(symbol, r * r * 2)();
const clamp = (t) => Math.max(0, Math.min(1, t));
const renderer = cm.canvas({width: size, height: size});
const root = cm.flow().renderer(renderer);
let from = {dx: 0, dy: 0, color: color("Viridis"), symbol: d3.symbolCircle};
let to = from;
let morphs = radii.map((r) => () => shape(from.symbol, r));
let start = 0;

function jiggle(time) {
  from = to;
  to = {
    dx: random(),
    dy: random(),
    color: color(schemes[d3.randomInt(schemes.length)()]),
    symbol: symbols[d3.randomInt(symbols.length)()],
  };
  morphs = radii.map((r) => flubber.interpolate(shape(from.symbol, r), shape(to.symbol, r)));
  start = time;
}

requestAnimationFrame(function frame(time) {
  if (time - start > 2000) jiggle(time);
  const elapsed = time - start;
  root.append(cm.clear, {fill: "white"});
  root.data(radii).append(cm.path, {
    x: (_, i) => size / 2 + i * d3.interpolate(from.dx, to.dx)(d3.easeElastic(clamp((elapsed - i * 20) / 1000))),
    y: (_, i) => size / 2 + i * d3.interpolate(from.dy, to.dy)(d3.easeElastic(clamp((elapsed - i * 20) / 1000))),
    d: (_, i) => morphs[i](clamp((elapsed - 500 - i * 25) / 500)),
    fill: (r, i) => d3.interpolateRgb(from.color(r), to.color(r))(clamp((elapsed - i * 25) / 500)),
    stroke: "black",
    strokeWidth: 0.5,
  });

  root.render();
  requestAnimationFrame(frame);
});

document.body.append(renderer.node());
```
