# Cars Flowing

120 vehicles [following a flow field](https://natureofcode.com/autonomous-agents/#flow-fields) made of [noise](/noise). Click the canvas for a new field.

```js eval t=example
const width = 640;
const height = 200;
const size = 20;
const cols = Math.floor(width / size);
const rows = Math.floor(height / size);
const fields = d3.cross(d3.range(cols), d3.range(rows));
const angles = new Array(cols * rows);
const random = (a, b) => a + Math.random() * (b - a);
const cars = Array.from({length: 120}, () => ({
  location: cm.vec(random(0, width), random(0, height)),
  velocity: cm.vec(),
  acceleration: cm.vec(),
  mass: 1,
  r: 4,
  maxSpeed: random(2, 5),
  maxForce: random(0.1, 0.5),
}));
const renderer = cm.canvas({width, height});
const root = cm.flow().renderer(renderer);
const node = renderer.node();

function initFields() {
  const noise = cm.noise(0, Math.PI * 4, {seed: Math.floor(Math.random() * 1e6)});
  for (const [i, j] of fields) angles[i + j * cols] = noise(j * 0.1, i * 0.1);
}

function follow(d) {
  const i = Math.max(0, Math.min(cols - 1, Math.floor(d.location.x / size)));
  const j = Math.max(0, Math.min(rows - 1, Math.floor(d.location.y / size)));
  const desired = cm.vecFromAngle(angles[i + j * cols]).mag(d.maxSpeed);
  const steer = cm.vecSub(desired, d.velocity).clamp(d.maxForce);
  d.acceleration.add(steer.div(d.mass));
}

function move(d) {
  d.velocity.add(d.acceleration);
  d.location.add(d.velocity);
  d.acceleration.mult(0);
}

function wrap(d) {
  d.location.x = (d.location.x + width) % width;
  d.location.y = (d.location.y + height) % height;
}

initFields();
node.style.border = "solid black 1px";
node.addEventListener("click", initFields);

requestAnimationFrame(function frame() {
  root.append(cm.clear, {fill: "white"});
  root
    .data(fields)
    .append(cm.group, {
      x: ([i]) => i * size + size / 2,
      y: ([, j]) => j * size + size / 2,
      rotate: ([i, j]) => angles[i + j * cols],
    })
    .append(cm.link, {x: -size / 4, y: 0, x1: size / 4, y1: 0, stroke: "#ccc"});
  root
    .data(cars)
    .process(cm.each, follow)
    .process(cm.each, move)
    .process(cm.each, wrap)
    .append(cm.group, {x: (d) => d.location.x, y: (d) => d.location.y, rotate: (d) => d.velocity.angle()})
    .append(cm.triangle, {
      x: (d) => d.r * 2,
      y: 0,
      x1: (d) => -d.r * 2,
      y1: (d) => -d.r,
      x2: (d) => -d.r * 2,
      y2: (d) => d.r,
      fill: "rgb(175, 175, 175)",
      stroke: "black",
      strokeWidth: 2,
    });

  root.render();
  requestAnimationFrame(frame);
});

document.body.append(node);
```
