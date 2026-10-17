# Cantor Set

The [Cantor set](https://en.wikipedia.org/wiki/Cantor_set) removes the middle third of a line, again and again. The plus variant grows perpendicular lines from both ends instead. After [The Nature of Code](https://natureofcode.com/fractals/).

```js eval code=false
const variant = Inputs.radio(["Cantor set", "Plus"], {label: "Variant", value: "Cantor set"});
```

```js eval t=example
const width = 640;
const height = variant === "Plus" ? 400 : 120;
const lines = [];

function cantor(x, y, length) {
  if (length < 1) return;
  lines.push({x1: x, y1: y, x2: x + length, y2: y});
  const l = length / 3;
  cantor(x, y + 20, l);
  cantor(x + l * 2, y + 20, l);
}

function plus(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  lines.push({x1, y1, x2, y2});
  if (dx === 0 && dy > 4) {
    plus(x1 - dy / 3, y1, x1 + dy / 3, y1);
    plus(x1 - dy / 3, y2, x1 + dy / 3, y2);
  } else if (dy === 0 && dx > 4) {
    plus(x1, y1 - dx / 3, x1, y1 + dx / 3);
    plus(x2, y1 - dx / 3, x2, y1 + dx / 3);
  }
}

if (variant === "Plus") plus(width / 4, height / 2, (3 * width) / 4, height / 2);
else cantor(20, 10, 600);

const renderer = cm.canvas({width, height});
const root = cm.flow().renderer(renderer);

root.data(lines).append(cm.link, {
  x: (d) => d.x1,
  y: (d) => d.y1,
  x1: (d) => d.x2,
  y1: (d) => d.y2,
  stroke: "black",
  strokeWidth: 2,
});

root.render();

document.body.append(renderer.node());
```
