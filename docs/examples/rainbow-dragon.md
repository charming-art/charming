# Rainbow Dragon

A square whose position, size, rotation and hue follow [noise](/noise). The canvas isn't cleared between frames, so the squares pile up into a trail.

```js eval code=false
const replay = Inputs.button("Replay");
```

```js eval t=example
replay;

const width = 640;
const height = 640;
const x = cm.noise(0, width);
const y = cm.noise(0, height);
const size = cm.noise(0, 100);
const rotate = cm.noise(0, Math.PI * 2);
const hue = cm.noise(0, 360);
const renderer = cm.canvas({width, height});
const root = cm.flow().renderer(renderer);
let frameCount = 0;

root.append(cm.clear, {fill: "orange"});

requestAnimationFrame(function frame() {
  const t = frameCount / 100;
  frameCount++;
  root.append(cm.group, {x: x(t), y: y(t), rotate: rotate(t)}).append(cm.rect, {
    x: 0,
    y: 0,
    width: size(t),
    height: size(t),
    fill: `hsl(${hue(t)}, 100%, 50%)`,
    fillOpacity: 0.5,
    stroke: "black",
  });

  root.render();
  requestAnimationFrame(frame);
});

document.body.append(renderer.node());
```
