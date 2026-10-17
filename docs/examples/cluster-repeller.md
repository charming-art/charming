# Cluster Repeller

A particle system under gravity, pushed away by a repeller whose force weakens with the square of the distance.

```js eval t=example
const width = 640;
const height = 200;
const particles = [];
const repeller = {location: cm.vec(width / 2, height - 50), power: 150};
const renderer = cm.canvas({width, height});
const root = cm.flow().renderer(renderer);

function applyForce(d, force) {
  d.acceleration.add(cm.vecDiv(force, d.mass));
}

function gravity(d) {
  applyForce(d, cm.vec(0, 0.1 * d.mass));
}

function repel(d) {
  const force = cm.vecSub(repeller.location, d.location);
  const distance = Math.max(5, Math.min(50, force.mag()));
  applyForce(d, force.mag((-1 * repeller.power) / (distance * distance)));
}

function fadeOut(d, i, data) {
  if (d.lifespan < 0) data.splice(i, 1);
  d.lifespan -= 2;
}

function move(d) {
  d.velocity.add(d.acceleration);
  d.location.add(d.velocity);
  d.acceleration.mult(0);
}

requestAnimationFrame(function frame() {
  root.append(cm.clear, {fill: "white"});
  root.datum(repeller).append(cm.circle, {
    x: (d) => d.location.x,
    y: (d) => d.location.y,
    r: 16,
    fill: "rgb(127, 127, 127)",
    stroke: "black",
  });
  root
    .data(particles)
    .process(cm.push, () => ({
      location: cm.vec(width / 2, 50),
      velocity: cm.vec(Math.random() * 2 - 1, Math.random() * -2),
      acceleration: cm.vec(),
      mass: 1,
      lifespan: 255,
    }))
    .process(cm.eachRight, fadeOut)
    .process(cm.each, repel)
    .process(cm.each, gravity)
    .process(cm.each, move)
    .append(cm.circle, {
      x: (d) => d.location.x,
      y: (d) => d.location.y,
      r: 5,
      fill: "black",
      stroke: "black",
      fillOpacity: (d) => d.lifespan,
      strokeOpacity: (d) => d.lifespan,
    })
    .transform(cm.mapAttrs, {
      fillOpacity: {domain: [0, 255], range: [0, 0.6]},
      strokeOpacity: {domain: [0, 255], range: [0, 1]},
    });

  root.render();
  requestAnimationFrame(frame);
});

document.body.append(renderer.node());
```
