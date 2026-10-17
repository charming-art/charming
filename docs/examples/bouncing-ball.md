# Bouncing Ball

A ball moving with a constant [velocity](/vector), bouncing off the edges.

```js eval code=false
const replay = Inputs.button("Replay");
```

```js eval t=example
replay;

const width = 640;
const height = 200;
const location = cm.vec(width / 2, height / 2);
const velocity = cm.vec(1, 2.3);
const renderer = cm.canvas({width, height});
const root = cm.flow().renderer(renderer);

renderer.node().style.border = "solid black 1px";

requestAnimationFrame(function frame() {
  location.add(velocity);
  if (location.x < 0 || location.x > width) velocity.x *= -1;
  if (location.y < 0 || location.y > height) velocity.y *= -1;

  root.append(cm.clear, {fill: "white"});
  root.append(cm.circle, {x: location.x, y: location.y, r: 16, fill: "rgb(175, 175, 175)", stroke: "black"});

  root.render();
  requestAnimationFrame(frame);
});

document.body.append(renderer.node());
```
