# Done

A circle on a string, going round and round.

```js eval t=example
const width = 640;
const height = 200;
const r = 75;
const renderer = cm.canvas({width, height});
const root = cm.flow().renderer(renderer);
let frameCount = 0;

requestAnimationFrame(function frame() {
  const theta = frameCount++ * 0.02;
  const x = r * Math.cos(theta);
  const y = r * Math.sin(theta);
  root.append(cm.clear, {fill: "white"});
  const group = root.append(cm.group, {x: width / 2, y: height / 2});
  group.append(cm.link, {x: 0, y: 0, x1: x, y1: y, stroke: "black"});
  group.append(cm.circle, {x, y, r: 10, fill: "black"});

  root.render();
  requestAnimationFrame(frame);
});

renderer.node().style.border = "solid black 1px";

document.body.append(renderer.node());
```
