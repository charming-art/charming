# Recursive Tree

A branch that grows two smaller branches at an angle, until the branches are too short. With weighting, the branches also get thinner. After [The Nature of Code](https://natureofcode.com/fractals/).

```js eval code=false
const angle = Inputs.range([0, Math.PI / 2], {label: "Angle", step: 0.01, value: Math.PI / 6});
```

```js eval code=false
const weighted = Inputs.toggle({label: "Weighted", value: true});
```

```js eval t=example
const width = 640;
const height = 300;
const branches = [];

function branch(start, end, strokeWidth) {
  const length = cm.vecDist(start, end);
  if (length < 2) return;
  branches.push({start, end, strokeWidth});
  const dir = cm.vecSub(end, start).angle();
  for (const a of [dir - angle, dir + angle]) {
    branch(end, cm.vecAdd(end, cm.vecFromAngle(a).mult(length * 0.67)), strokeWidth * 0.75);
  }
}

branch(cm.vec(width / 2, height), cm.vec(width / 2, height - 100), 10);

const renderer = cm.canvas({width, height});
const root = cm.flow().renderer(renderer);

root.data(branches).append(cm.link, {
  x: (d) => d.start.x,
  y: (d) => d.start.y,
  x1: (d) => d.end.x,
  y1: (d) => d.end.y,
  stroke: "black",
  strokeWidth: (d) => (weighted ? d.strokeWidth : 1.5),
  strokeCap: "round",
});

root.render();

document.body.append(renderer.node());
```
