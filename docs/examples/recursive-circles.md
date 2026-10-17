# Recursive Circles

A circle that draws smaller circles inside itself, until they're too small: once in the center, twice side by side, or four times around. After [The Nature of Code](https://natureofcode.com/fractals/).

```js eval code=false
const branches = Inputs.radio([1, 2, 4], {label: "Branches", value: 2});
```

```js eval t=example
const size = 640;
const circles = [];

function drawCircle(x, y, r) {
  if (r < (branches === 4 ? 16 : 4)) return;
  circles.push({x, y, r});
  if (branches === 1) drawCircle(x, y, r * 0.75);
  if (branches >= 2) {
    drawCircle(x - r / 2, y, r / 2);
    drawCircle(x + r / 2, y, r / 2);
  }
  if (branches === 4) {
    drawCircle(x, y - r / 2, r / 2);
    drawCircle(x, y + r / 2, r / 2);
  }
}

drawCircle(size / 2, size / 2, 300);

const renderer = cm.canvas({width: size, height: size});
const root = cm.flow().renderer(renderer);

root.data(circles).append(cm.circle, {
  x: (d) => d.x,
  y: (d) => d.y,
  r: (d) => d.r,
  fill: "transparent",
  stroke: "black",
  strokeWidth: 2,
});

root.render();

document.body.append(renderer.node());
```
