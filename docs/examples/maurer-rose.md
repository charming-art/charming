# Maurer Rose

A [Maurer rose](https://en.wikipedia.org/wiki/Maurer_rose) (black) over the rose it's drawn from (red), each a closed [line](/shape#cm-line). Based on [A rose is a rose](https://observablehq.com/@recifs/a-rose-is-a-rose) by Philippe Rivière.

```js eval t=example
const n = 10;
const d = 17;
const angles = Array.from({length: 360}, (_, i) => (i * Math.PI) / 180);
const renderer = cm.canvas({width: 480, height: 480});
const root = cm.flow().renderer(renderer);

root
  .data(angles)
  .append(cm.line, {
    x: (i) => Math.sin(n * d * i) * Math.cos(d * i),
    y: (i) => Math.sin(n * d * i) * Math.sin(d * i),
    stroke: "black",
    strokeWidth: 0.33,
    close: true,
  })
  .transform(cm.mapPosition, {domainX: [-1, 1], domainY: [-1, 1], padding: 10});

root
  .data(angles)
  .append(cm.line, {
    x: (i) => Math.sin(n * i) * Math.cos(i),
    y: (i) => Math.sin(n * i) * Math.sin(i),
    stroke: "red",
    strokeWidth: 2.5,
    close: true,
  })
  .transform(cm.mapPosition, {domainX: [-1, 1], domainY: [-1, 1], padding: 10});

root.render();

document.body.append(renderer.node());
```
