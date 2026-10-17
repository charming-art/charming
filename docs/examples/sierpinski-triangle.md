# Sierpiński Triangle

The [Sierpiński triangle](https://en.wikipedia.org/wiki/Sierpi%C5%84ski_triangle): a triangle split into three at its edges' midpoints, again and again, drawn with [triangles](/shape#cm-triangle). After [The Nature of Code](https://natureofcode.com/fractals/).

```js eval code=false
const levels = Inputs.range([0, 7], {label: "Levels", step: 1, value: 5});
```

```js eval t=example
const width = 640;
const padding = 10;
const height = Math.round(((width - padding * 2) / 2) * Math.sqrt(3) + padding * 2);
const triangles = [];

function split(p0, p1, p2, level) {
  if (level === levels) return triangles.push([p0, p1, p2]);
  const m01 = cm.vecAdd(p0, p1).div(2);
  const m12 = cm.vecAdd(p1, p2).div(2);
  const m20 = cm.vecAdd(p2, p0).div(2);
  split(p0, m01, m20, level + 1);
  split(m01, p1, m12, level + 1);
  split(m20, m12, p2, level + 1);
}

split(cm.vec(width / 2, padding), cm.vec(padding, height - padding), cm.vec(width - padding, height - padding), 0);

const renderer = cm.canvas({width, height});
const root = cm.flow().renderer(renderer);

root.data(triangles).append(cm.triangle, {
  x: ([p]) => p.x,
  y: ([p]) => p.y,
  x1: ([, p]) => p.x,
  y1: ([, p]) => p.y,
  x2: ([, , p]) => p.x,
  y2: ([, , p]) => p.y,
  fill: "black",
});

root.render();

document.body.append(renderer.node());
```
