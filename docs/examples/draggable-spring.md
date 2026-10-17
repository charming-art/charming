# Draggable Spring

A bob hanging from a spring, pulled by gravity and by [Hooke's law](https://en.wikipedia.org/wiki/Hooke%27s_law), with some damping. Drag the bob and let it go.

```js eval code=false
const replay = Inputs.button("Replay");
```

```js eval t=example
replay;

const width = 640;
const height = 200;
const spring = {k: 0.1, length: 100};
const anchor = {location: cm.vec(0, 0)};
const bob = {location: cm.vec(120, 160), velocity: cm.vec(), acceleration: cm.vec(), mass: 1};
const renderer = cm.canvas({width, height});
const root = cm.flow().renderer(renderer);
const node = renderer.node();
let dragging = false;

node.style.border = "solid black 1px";
node.style.touchAction = "none";

// The pointer in canvas coordinates, also when the canvas is scaled to fit the page.
const pointer = (event) => [(event.offsetX / node.clientWidth) * width, (event.offsetY / node.clientHeight) * height];
const onpointerup = () => (dragging = false);

node.addEventListener("pointerdown", (event) => {
  dragging = true;
  drag(event);
});
node.addEventListener("pointermove", (event) => dragging && drag(event));
window.addEventListener("pointerup", onpointerup);
invalidation.then(() => window.removeEventListener("pointerup", onpointerup));

function drag(event) {
  const [x, y] = pointer(event);
  bob.location.set(x - width / 2, y);
  bob.velocity.mult(0);
}

function applyForce(d, force) {
  d.acceleration.add(cm.vecDiv(force, d.mass));
}

function gravity(d) {
  applyForce(d, cm.vec(0, d.mass));
}

function pull(d) {
  const force = cm.vecSub(d.location, anchor.location);
  const stretch = force.mag() - spring.length;
  applyForce(d, force.mag(-1 * spring.k * stretch));
}

function move(d) {
  d.velocity.add(d.acceleration).mult(0.98);
  d.location.add(d.velocity);
  d.acceleration.mult(0);
}

requestAnimationFrame(function frame() {
  root.append(cm.clear, {fill: "white"});
  const group = root.append(cm.group, {x: width / 2, y: 0});
  const flow = dragging
    ? group.datum(bob)
    : group.datum(bob).process(cm.each, gravity).process(cm.each, pull).process(cm.each, move);
  const x = (d) => d.location.x;
  const y = (d) => d.location.y;
  flow.append(cm.link, {x: 0, y: 0, x1: x, y1: y, stroke: "black"});
  flow.append(cm.circle, {x, y, r: 20, fill: dragging ? "black" : "rgb(175, 175, 175)", stroke: "black"});
  group.append(cm.rect, {x: -5, y: 0, width: 10, height: 10, fill: "rgb(175, 175, 175)", stroke: "black"});

  root.render();
  requestAnimationFrame(frame);
});

document.body.append(node);
```
