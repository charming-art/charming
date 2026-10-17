# Oscillates

Twenty oscillators, each moving along a sine wave in x and in y with its own amplitudes and speeds.

```js eval t=example
const width = 640;
const height = 200;
const random = (a, b) => a + Math.random() * (b - a);
const oscillators = Array.from({length: 20}, () => ({
  angle: cm.vec(),
  velocity: cm.vec(random(-0.05, 0.05), random(-0.05, 0.05)),
  amplitude: cm.vec(random(0, width / 2), random(0, height / 2)),
}));
const x = (d) => Math.sin(d.angle.x) * d.amplitude.x;
const y = (d) => Math.sin(d.angle.y) * d.amplitude.y;
const renderer = cm.canvas({width, height});
const root = cm.flow().renderer(renderer);

renderer.node().style.border = "solid black 1px";

requestAnimationFrame(function frame() {
  root.append(cm.clear, {fill: "white"});
  const group = root
    .append(cm.group, {x: width / 2, y: height / 2})
    .data(oscillators)
    .process(cm.each, (d) => d.angle.add(d.velocity));
  group.append(cm.link, {x: 0, y: 0, x1: x, y1: y, stroke: "black"});
  group.append(cm.circle, {x, y, r: 16, fill: "rgb(175, 175, 175)", fillOpacity: 0.5, stroke: "black"});

  root.render();
  requestAnimationFrame(frame);
});

document.body.append(renderer.node());
```
