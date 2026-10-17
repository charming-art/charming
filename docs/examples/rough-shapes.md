# Sketchy Shapes, Rough.js

A square recursively divided into squares, each holding a hand-drawn shape. [Rough.js](https://roughjs.com/)'s generator turns each shape into sketchy SVG path data, which Charming draws as [paths](/shape#cm-path) on a canvas. The palette is Émile Cheysson's, after Claudio Esperança's [Random shapes in a grid](https://observablehq.com/@esperanc/random-shapes-in-a-grid).

```js eval code=false
const regenerate = Inputs.button("Regenerate");
```

```js eval t=example
regenerate;

const size = 640;
const padding = 5;
const rows = 8;
const unit = (size - padding * 2) / rows;
const colors = ["#CA6A6F", "#8B9D83", "#DAC474", "#8DA9B0", "#ADA9A5", "#DF8749", "#A791A3"];
const styles = ["hachure", "solid", "zigzag", "cross-hatch", "dots", "dashed", "zigzag-line"];
const symbols = [d3.symbolCircle, d3.symbolSquare, d3.symbolDiamond2, d3.symbolCross];
const pick = (a) => a[d3.randomInt(a.length)()];

// Divide a square of rows × rows units into squares.
function fillSquares() {
  const cells = [{x: 0, y: 0, x1: rows, y1: rows}];
  const square = ({x, y, x1, y1}) => x1 - x === y1 - y && x1 - x !== rows;
  const divide = ({x, y, x1, y1}, [px, py]) => [
    {x, y, x1: px, y1: py},
    {x: px, y, x1, y1: py},
    {x: px, y: py, x1, y1},
    {x, y: py, x1: px, y1},
  ];
  function fill(i) {
    const cell = cells[i];
    const points = d3.cross(d3.range(cell.x, cell.x1 + 1), d3.range(cell.y, cell.y1 + 1));
    const point = pick(points.filter((p) => divide(cell, p).some(square)));
    const subcells = divide(cell, point).filter(({x, y, x1, y1}) => x1 - x >= 1 && y1 - y >= 1);
    cells.splice(i, 1, ...subcells);
    for (let j = subcells.length - 1; j >= 0; j--) if (!square(subcells[j])) fill(i + j);
  }
  fill(0);
  return cells;
}

// Sketch a shape with Rough.js, as path data.
const generator = rough.generator();
const paths = fillSquares().flatMap((cell) => {
  const side = (cell.x1 - cell.x) * unit;
  const d = d3.symbol(pick(symbols), (side - 10) ** 2 * 0.5)();
  const drawable = generator.path(d, {fill: pick(colors), fillStyle: pick(styles), stroke: "black", strokeWidth: 2});
  return generator.toPaths(drawable).map((path) => ({
    ...path,
    x: padding + cell.x * unit + side / 2,
    y: padding + cell.y * unit + side / 2,
  }));
});

const renderer = cm.canvas({width: size, height: size});
const root = cm.flow().renderer(renderer);
const none = (color) => (color === "none" ? undefined : color);

root.append(cm.clear, {fill: "#fff5eb"});
root.data(paths).append(cm.path, {
  x: (d) => d.x,
  y: (d) => d.y,
  d: (d) => d.d,
  fill: (d) => none(d.fill),
  stroke: (d) => none(d.stroke),
  strokeWidth: (d) => d.strokeWidth,
});

root.render();

document.body.append(renderer.node());
```
