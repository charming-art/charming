# Beesandbombs

A grid of spinning half-moons. Each is a [d3-geo](https://d3js.org/d3-geo) circle on a rotating orthographic projection, drawn into [_cm_.pathContext](/path#cm-path-context) and appended as a [path](/shape#cm-path). A reimplementation of Mike Bostock's [Beesandbombs](https://observablehq.com/d/a741f9a27e8c0e73).

```js eval t=example
const radius = 12;
const ticks = Array.from({length: 20}, (_, i) => -1 + (i / 19) * 2);
const data = d3.cross(ticks, ticks);
const circle = d3.geoCircle()();
const projection = d3.geoOrthographic().translate([0, 0]).scale(radius);
const path = d3.geoPath(projection);
const renderer = cm.canvas({width: 640, height: 640});
const root = cm.flow().renderer(renderer);
let frameCount = 0;

requestAnimationFrame(function frame() {
  const now = frameCount++ / 100;
  root.append(cm.clear, {fill: "white"});
  root
    .data(data)
    .append(cm.circle, {
      x: (d) => d[0],
      y: (d) => d[1],
      r: radius,
      fill: "white",
      stroke: "black",
      strokeWidth: 1.5,
    })
    .transform(cm.mapPosition, {padding: 20});
  root
    .data(data)
    .append(cm.path, {
      x: (d) => d[0],
      y: (d) => d[1],
      fill: "black",
      d: ([x, y]) => {
        const l = ((Math.hypot(x, y) + Math.atan2(y, x) / (Math.PI * 2) - now) % 1) * -360;
        projection.rotate([0, l, -l]);
        const context = cm.pathContext();
        path.context(context)(circle);
        return context.toArray();
      },
    })
    .transform(cm.mapPosition, {padding: 20});

  root.render();
  requestAnimationFrame(frame);
});

document.body.append(renderer.node());
```
