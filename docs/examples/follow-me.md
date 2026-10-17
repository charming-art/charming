# Follow Me

Twenty balls accelerating toward the mouse. Move the mouse over the canvas.

```js eval code=false
const replay = Inputs.button("Replay");
```

```js eval t=example
replay;

const width = 640;
const height = 200;
const mouse = cm.vec(width / 2, height / 2);
const movers = Array.from({length: 20}, () => ({
  location: cm.vec(Math.random() * width, Math.random() * height),
  velocity: cm.vec(),
  speed: 8,
}));
const renderer = cm.canvas({width, height});
const root = cm.flow().renderer(renderer);
const node = renderer.node();

node.style.border = "solid black 1px";
node.addEventListener("pointermove", (event) => mouse.set(event.offsetX, event.offsetY));

function follow({location, velocity, speed}) {
  const acceleration = cm.vecSub(mouse, location).norm().mult(0.5);
  location.add(velocity.add(acceleration).clamp(speed));
}

requestAnimationFrame(function frame() {
  root.append(cm.clear, {fill: "white"});
  root
    .data(movers)
    .process(cm.each, follow)
    .append(cm.circle, {
      x: (d) => d.location.x,
      y: (d) => d.location.y,
      r: 16,
      fill: "rgba(175, 175, 175, 0.5)",
      stroke: "black",
    });

  root.render();
  requestAnimationFrame(frame);
});

document.body.append(node);
```
