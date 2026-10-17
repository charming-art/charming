# Car Arriving

A vehicle steering toward the mouse with Craig Reynolds's [arrival behavior](https://www.red3d.com/cwr/steer/): it slows down as it gets close. Move the mouse over the canvas.

```js eval t=example
const width = 640;
const height = 200;
const target = cm.vec(width - 100, height / 2);
const car = {
  location: cm.vec(100, height / 2),
  velocity: cm.vec(),
  acceleration: cm.vec(),
  mass: 1,
  maxSpeed: 4,
  maxForce: 0.1,
  r: 6,
};
const slow = cm.scaleLinear([0, 100], [0, car.maxSpeed]);
const renderer = cm.canvas({width, height});
const root = cm.flow().renderer(renderer);
const node = renderer.node();

node.style.border = "solid black 1px";

// The pointer in canvas coordinates, also when the canvas is scaled to fit the page.
const pointer = (event) => [(event.offsetX / node.clientWidth) * width, (event.offsetY / node.clientHeight) * height];

node.addEventListener("pointermove", (event) => target.set(...pointer(event)));

function arrive(d) {
  const desired = cm.vecSub(target, d.location);
  const distance = desired.mag();
  desired.mag(distance > 100 ? d.maxSpeed : slow(distance));
  const steer = cm.vecSub(desired, d.velocity).clamp(d.maxForce);
  d.acceleration.add(steer.div(d.mass));
}

function move(d) {
  d.velocity.add(d.acceleration);
  d.location.add(d.velocity);
  d.acceleration.mult(0);
}

requestAnimationFrame(function frame() {
  root.append(cm.clear, {fill: "white"});
  root.append(cm.circle, {
    x: target.x,
    y: target.y,
    r: 24,
    fill: "rgb(175, 175, 175)",
    stroke: "black",
    strokeWidth: 2,
  });
  const group = root
    .datum(car)
    .process(cm.each, arrive)
    .process(cm.each, move)
    .append(cm.group, {
      x: (d) => d.location.x,
      y: (d) => d.location.y,
      rotate: (d) => d.velocity.angle(),
    });
  group.append(cm.triangle, {
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
  group.append(cm.circle, {x: (d) => d.r * 2, y: 0, r: 5, fill: "red"});

  root.render();
  requestAnimationFrame(frame);
});

document.body.append(node);
```
