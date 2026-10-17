# Snake Wave

The product of three sine waves with different periods, so the wave wriggles like a snake.

```js eval t=example
const renderer = cm.canvas({width: 640, height: 200});
const root = cm.flow().renderer(renderer);
const count = 50;
const I = Array.from({length: count}, (_, i) => i);
const X = I.map((i) => (i / count) * Math.PI * 2);
const X1 = I.map((i) => (i / count) * Math.PI * 4);
const X2 = I.map((i) => (i / count) * ((Math.PI * 2) / 3));
let frameCount = 0;

requestAnimationFrame(function frame() {
  frameCount++;
  const offset = frameCount / 120;
  root.append(cm.clear, {fill: "white"});
  root
    .data(I)
    .append(cm.circle, {
      x: (d) => d,
      y: (d) => Math.sin(X[d] + offset) * 2 * Math.sin(X1[d] + offset) * Math.sin(X2[d] + offset) * 3,
      r: 20,
      fill: (d) => d,
      fillOpacity: 0.6,
      stroke: "black",
      strokeWidth: 1,
    })
    .transform(cm.mapPosition, {padding: 20})
    .transform(cm.mapAttrs, {fill: {interpolate: d3.interpolateGreys}});

  root.render();
  requestAnimationFrame(frame);
});

document.body.append(renderer.node());
```
