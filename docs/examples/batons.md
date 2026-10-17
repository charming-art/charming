# Batons

Three batons, each a [group](/shape#cm-group) of a link and two circles, spinning.

```js eval t=example
const width = 640;
const height = 200;
const renderer = cm.canvas({width, height});
const root = cm.flow().renderer(renderer);
let frameCount = 0;

requestAnimationFrame(function frame() {
  frameCount++;
  root.append(cm.clear, {fill: "white"});
  const batons = root.data([0, 1, 2]).append(cm.group, {
    x: (_, i) => ((i + 0.5) * width) / 3,
    y: height / 2,
    rotate: (_, i) => frameCount / 50 + i * 30,
  });
  batons.append(cm.link, {x: -80, y: 0, x1: 80, y1: 0, stroke: "black"});
  batons.append(cm.circle, {x: -80, y: 0, r: 5, fill: "black"});
  batons.append(cm.circle, {x: 80, y: 0, r: 5, fill: "black"});

  root.render();
  requestAnimationFrame(frame);
});

document.body.append(renderer.node());
```
