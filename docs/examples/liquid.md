# Liquid

Balls falling by gravity, slowed down by drag once they enter the liquid. Heavier balls are bigger, with a [square root scale](/scale#cm-scale-sqrt).

```js eval code=false
const replay = Inputs.button("Replay");
```

```js eval t=example
replay;

const width = 640;
const height = 200;
const liquid = {x: 0, y: height / 2, width, height: height / 2, c: 0.1};
const random = (a, b) => a + Math.random() * (b - a);
const movers = Array.from({length: 25}, () => ({
  location: cm.vec(random(0, width), 0),
  velocity: cm.vec(),
  acceleration: cm.vec(),
  mass: random(1, 5),
}));
const renderer = cm.canvas({width, height});
const root = cm.flow().renderer(renderer);

renderer.node().style.border = "solid black 1px";

function applyForce(d, force) {
  d.acceleration.add(cm.vecDiv(force, d.mass));
}

function gravity(d) {
  applyForce(d, cm.vec(0, 0.1 * d.mass));
}

function drag(d) {
  if (d.location.y < liquid.y) return;
  const speed = d.velocity.mag();
  applyForce(d, cm.vecMult(d.velocity, -1).mag(liquid.c * speed * speed));
}

function move(d) {
  d.velocity.add(d.acceleration);
  d.location.add(d.velocity);
  d.acceleration.mult(0);
}

function bounce(d) {
  if (d.location.y > height) {
    d.location.y = height;
    d.velocity.y *= -1;
  }
}

requestAnimationFrame(function frame() {
  root.append(cm.clear, {fill: "white"});
  root.append(cm.rect, {...liquid, fill: "rgb(175, 175, 175)"});
  root
    .data(movers)
    .process(cm.each, gravity)
    .process(cm.each, drag)
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
