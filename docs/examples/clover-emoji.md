# Clover 🌟

A clover curve drawn with stars on the [terminal renderer](/terminal). In double mode, each cell is two characters wide, so emoji line up.

```js eval t=example
const cols = 30;
const rows = 24;
const renderer = cm.terminal({cols, rows, mode: "double"});
const root = cm.flow().renderer(renderer);

root
  .data(Array.from({length: 240}, (_, i) => (i / 240) * Math.PI * 2))
  .append(cm.group, {x: cols / 2, y: rows / 2})
  .append(cm.point, {
    x: (t) => 10 * Math.cos(t) * Math.cos(t * 3),
    y: (t) => 10 * Math.sin(t) * Math.cos(t * 3),
    stroke: {ch: "🌟", wide: true},
  });

root.render();

document.body.append(renderer.node());
```
