# Mover

A rectangle accelerating toward the mouse, with its speed limited and its rotation following its [velocity](/vector). Move the mouse over the canvas.

```js eval t=example
const width = 640;
const height = 200;
const mover = {location: cm.vec(width / 2, height / 2), velocity: cm.vec(), acceleration: cm.vec(), mass: 1};
const mouse = cm.vec(width / 2, height / 2);
const renderer = cm.canvas({width, height});
const root = cm.flow().renderer(renderer);
const node = renderer.node();

node.style.border = "solid black 1px";
node.addEventListener("pointermove", (event) => mouse.set(event.offsetX, event.offsetY));

function applyForce(d, force) {
  d.acceleration.add(cm.vecDiv(force, d.mass));
}

function toMouse(d) {
  applyForce(d, cm.vecSub(mouse, d.location).mag(0.5));
}

function move(d) {
  d.velocity.add(d.acceleration).clamp(4);
  d.location.add(d.velocity);
  d.acceleration.mult(0);
}

requestAnimationFrame(function frame() {
  root.append(cm.clear, {fill: "white"});
  root
    .datum(mover)
    .process(cm.each, toMouse)
    .process(cm.each, move)
    .append(cm.rect, {
      x: (d) => d.location.x,
      y: (d) => d.location.y,
      width: 30,
      height: 10,
      anchor: "center",
      fill: "rgb(175, 175, 175)",
      stroke: "black",
      rotate: (d) => d.velocity.angle(),
    });

  root.render();
  requestAnimationFrame(frame);
});

document.body.append(node);
```
