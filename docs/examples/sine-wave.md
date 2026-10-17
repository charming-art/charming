# Sine Wave

Circles along a sine wave, shifted a little every frame.

```js eval t=example
const renderer = cm.canvas({width: 640, height: 200});
const root = cm.flow().renderer(renderer);
const X = Array.from({length: 50}, (_, i) => (i / 50) * Math.PI * 2);
let frameCount = 0;

requestAnimationFrame(function frame() {
  frameCount++;
  root.append(cm.clear, {fill: "white"});
  root
    .data(X)
    .append(cm.circle, {
      x: (d) => d,
      y: (d) => Math.sin(d + frameCount / 30),
      r: 20,
      fill: "rgba(175, 175, 175, 0.5)",
      stroke: "black",
      strokeWidth: 1,
    })
    .transform(cm.mapPosition, {padding: 20});

  root.render();
  requestAnimationFrame(frame);
});

document.body.append(renderer.node());
```
