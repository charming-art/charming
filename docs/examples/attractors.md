# Attractors

Twenty movers attracting each other by gravity. For each mover, [_cm_.each](/process#cm-each) sums the forces from the others, after [_cm_.filter](/process#cm-filter) leaves the mover itself out.

```js eval code=false
const replay = Inputs.button("Replay");
```

```js eval t=example
replay;

const width = 640;
const height = 200;
const G = 0.4;
const random = (a, b) => a + Math.random() * (b - a);
const movers = Array.from({length: 20}, () => ({
  location: cm.vec(random(0, width), random(0, height)),
  velocity: cm.vec(random(-1, 1), random(-1, 1)),
  acceleration: cm.vec(),
  mass: random(2, 5),
}));
const renderer = cm.canvas({width, height});
const root = cm.flow().renderer(renderer);

renderer.node().style.border = "solid black 1px";

function attract(attractor, d) {
  const dir = cm.vecSub(attractor.location, d.location);
  const dist = cm.vecClamp(dir, 5, 25).mag();
  const strength = (G * attractor.mass * d.mass) / (dist * dist);
  d.acceleration.add(dir.mag(strength).div(d.mass));
}

function move(d) {
  d.velocity.add(d.acceleration);
  d.location.add(d.velocity);
  d.acceleration.mult(0);
}

requestAnimationFrame(function frame() {
  root.append(cm.clear, {fill: "white"});
  root
    .data(movers)
    .process(cm.each, (d) =>
      root
        .data(movers)
        .process(cm.filter, (other) => other !== d)
        .process(cm.each, (other) => attract(other, d)),
    )
    .process(cm.each, move)
    .append(cm.circle, {
      x: (d) => d.location.x,
      y: (d) => d.location.y,
      r: (d) => d.mass * 2,
      fill: "rgb(175, 175, 175)",
      stroke: "black",
      strokeWidth: 2,
    });

  root.render();
  requestAnimationFrame(frame);
});

document.body.append(renderer.node());
```
