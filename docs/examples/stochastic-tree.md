# Stochastic Tree

A recursive tree whose branches grow at random angles, so every tree is different. After [The Nature of Code](https://natureofcode.com/fractals/).

```js eval code=false
const regenerate = Inputs.button("Regenerate");
```

```js eval t=example
regenerate;

const width = 640;
const height = 300;
const branches = [];

function branch(start, end, strokeWidth) {
  const length = cm.vecDist(start, end);
  if (length < 2) return;
  branches.push({start, end, strokeWidth});
  const dir = cm.vecSub(end, start).angle();
  for (let i = 0; i < 2; i++) {
    const a = dir + (Math.random() - 0.5) * Math.PI;
    branch(end, cm.vecAdd(end, cm.vecFromAngle(a).mult(length * 0.67)), strokeWidth * 0.75);
  }
}

branch(cm.vec(width / 2, height), cm.vec(width / 2, height - 100), 8);

const renderer = cm.canvas({width, height});
const root = cm.flow().renderer(renderer);

root.data(branches).append(cm.link, {
  x: (d) => d.start.x,
  y: (d) => d.start.y,
  x1: (d) => d.end.x,
  y1: (d) => d.end.y,
  stroke: "black",
  strokeWidth: (d) => d.strokeWidth,
  strokeCap: "round",
});

root.render();

document.body.append(renderer.node());
```
