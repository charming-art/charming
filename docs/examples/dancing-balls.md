# Dancing Balls

Balls of different masses under the same gravity and wind. Lighter balls accelerate more, so they dance ahead of the heavier ones.

```js eval code=false
const replay = Inputs.button("Replay");
```

```js eval t=example
replay;

const width = 640;
const height = 200;
const gravity = cm.vec(0, 0.2);
const wind = cm.vec(0.02, 0);
const movers = Array.from({length: 25}, () => ({
  location: cm.vec(),
  velocity: cm.vec(),
  acceleration: cm.vec(),
  mass: 0.1 + Math.random() * 4.9,
}));
const renderer = cm.canvas({width, height});
const root = cm.flow().renderer(renderer);

renderer.node().style.border = "solid black 1px";

function applyForces(d) {
  d.acceleration.add(cm.vecDiv(wind, d.mass));
  d.acceleration.add(cm.vecDiv(gravity, d.mass));
}

function move(d) {
  d.velocity.add(d.acceleration);
  d.location.add(d.velocity);
  d.acceleration.mult(0);
}

function bounce(d) {
  if (d.location.x < 0 || d.location.x > width) {
    d.location.x = Math.max(0, Math.min(width, d.location.x));
    d.velocity.x *= -1;
  }
  if (d.location.y > height) {
    d.location.y = height;
    d.velocity.y *= -1;
  }
}

requestAnimationFrame(function frame() {
  root.append(cm.clear, {fill: "white"});
  root
    .data(movers)
    .process(cm.each, applyForces)
    .process(cm.each, move)
    .process(cm.each, bounce)
    .append(cm.circle, {
      x: (d) => d.location.x,
      y: (d) => d.location.y,
      r: (d) => d.mass,
      fill: "rgba(175, 175, 175, 0.5)",
      stroke: "black",
    })
    .transform(cm.mapAttrs, {r: {scale: cm.scaleSqrt, range: [2, 20]}});

  root.render();
  requestAnimationFrame(frame);
});

document.body.append(renderer.node());
```
