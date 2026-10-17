# Car Wandering

A vehicle [wandering](https://www.red3d.com/cwr/steer/): it seeks a target that drifts randomly along a circle projected in front of it, and wraps around the edges.

```js eval t=example
const width = 640;
const height = 200;
const car = {
  location: cm.vec(width / 2, height / 2),
  velocity: cm.vec(1, 0),
  acceleration: cm.vec(),
  mass: 1,
  maxSpeed: 2,
  maxForce: 0.05,
  r: 6,
  wanderR: 25,
  wanderD: 80,
  wanderT: 0,
  wanderC: 0.3,
};
const renderer = cm.canvas({width, height});
const root = cm.flow().renderer(renderer);

renderer.node().style.border = "solid black 1px";

function wander(d) {
  d.circle = d.velocity.clone().mag(d.wanderD).add(d.location);
  d.wanderT += (Math.random() * 2 - 1) * d.wanderC;
  const theta = d.wanderT + d.velocity.angle();
  d.target = cm.vecAdd(d.circle, cm.vec(d.wanderR * Math.cos(theta), d.wanderR * Math.sin(theta)));
}

function seek(d) {
  const desired = cm.vecSub(d.target, d.location).mag(d.maxSpeed);
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

requestAnimationFrame(function frame() {
  root.append(cm.clear, {fill: "white"});
  const flow = root
    .datum(car)
    .process(cm.each, wander)
    .process(cm.each, seek)
    .process(cm.each, move)
    .process(cm.each, wrap);
  flow.append(cm.circle, {
    x: (d) => d.circle.x,
    y: (d) => d.circle.y,
    r: (d) => d.wanderR,
    fill: "white",
    stroke: "black",
  });
  flow.append(cm.link, {
    x: (d) => d.circle.x,
    y: (d) => d.circle.y,
    x1: (d) => d.location.x,
    y1: (d) => d.location.y,
    stroke: "black",
  });
  flow.append(cm.circle, {
    x: (d) => d.target.x,
    y: (d) => d.target.y,
    r: 2,
    fill: "rgb(175, 175, 175)",
    stroke: "black",
  });
  flow.append(cm.link, {
    x: (d) => d.circle.x,
    y: (d) => d.circle.y,
    x1: (d) => d.target.x,
    y1: (d) => d.target.y,
    stroke: "black",
  });
  flow
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

document.body.append(renderer.node());
```
