# Koch Curve

The [Koch curve](https://en.wikipedia.org/wiki/Koch_snowflake): each segment is replaced by four, with a bump in the middle, computed with [vectors](/vector). Three curves around a triangle make the snowflake. After [The Nature of Code](https://natureofcode.com/fractals/).

```js eval code=false
const shape = Inputs.radio(["Curve", "Snowflake"], {label: "Shape", value: "Snowflake"});
```

```js eval code=false
const levels = Inputs.range([0, 5], {label: "Levels", step: 1, value: 4});
```

```js eval t=example
const width = 640;
const height = shape === "Curve" ? 200 : 640;
const padding = 10;
const points = [];

if (shape === "Curve") {
  points.push(cm.vec(padding, height - padding), cm.vec(width - padding, height - padding));
} else {
  const d = width - padding * 2;
  const y2 = height - padding;
  const y1 = y2 - d * 0.75;
  const dx = (d * Math.sqrt(3)) / 4;
  points.push(cm.vec(width / 2 - dx, y1), cm.vec(width / 2 + dx, y1), cm.vec(width / 2, y2));
}

// Replace the segment from point i to point j with four segments.
function koch(i, j, level) {
  if (level >= levels) return;
  const n = points.length;
  const start = points[i % n];
  const end = points[j % n];
  const dir = cm.vecSub(end, start).div(3);
  const p0 = cm.vecAdd(start, dir);
  const p1 = cm.vecAdd(p0, cm.vecFromAngle(dir.angle() - Math.PI / 3).mult(dir.mag()));
  const p2 = cm.vecAdd(p0, dir);
  points.splice(i + 1, 0, p0, p1, p2);
  for (let k = i + 4; k > i; k--) koch(k - 1, k, level + 1);
}

if (shape === "Curve") koch(0, 1, 0);
else for (let i = 2; i >= 0; i--) koch(i, i + 1, 0);

const renderer = cm.canvas({width, height});
const root = cm.flow().renderer(renderer);

root.data(points).append(cm.line, {
  x: (d) => d.x,
  y: (d) => d.y,
  stroke: "black",
  strokeWidth: 2,
  close: shape === "Snowflake",
});

root.render();

document.body.append(renderer.node());
```
