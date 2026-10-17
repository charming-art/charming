# Particles

_Noise Swirl_: 600 particles drifting along a [noise](/noise) field without clearing the canvas, so they leave trails. Made for [Genuary 2024](https://genuary.art/prompts#jan1), "Particles, lots of them", after an [OpenProcessing sketch](https://openprocessing.org/sketch/494102).

```js eval code=false
const replay = Inputs.button("Replay");
```

```js eval t=example
replay;

const width = 640;
const height = Math.round(width * 0.618);
const speed = 0.4;
const scale = 800;
const count = 200;
const noise = cm.noise(0, Math.PI * 2 * scale);
const random = (a, b) => a + Math.random() * (b - a);
const particles = Array.from({length: count * 3}, (_, i) => ({
  type: Math.floor(i / count),
  index: i % count,
  location: cm.vec(random(0, width), random(0, height)),
}));
const renderer = cm.canvas({width, height});
const root = cm.flow().renderer(renderer);

function move(d) {
  const angle = noise(d.location.x / scale, d.location.y / scale);
  d.location.add(cm.vecFromAngle(angle).mult(speed));
  const {x, y} = d.location;
  if (x < 0 || x > width || y < 0 || y > height) d.location.set(random(50, width), random(50, height));
}

root.append(cm.clear, {fill: "rgb(21, 8, 50)"});

requestAnimationFrame(function frame() {
  root
    .data(particles)
    .process(cm.each, move)
    .append(cm.circle, {
      x: (d) => d.location.x,
      y: (d) => d.location.y,
      r: (d) => d.index,
      fill: (d) => d.type,
      fillOpacity: (d) => d.index,
    })
    .transform(cm.mapAttrs, {
      r: {range: [0.5, 1]},
      fillOpacity: {range: [0, 1]},
      fill: {scale: cm.scaleOrdinal, range: ["rgb(69, 33, 124)", "rgb(7, 153, 242)", "white"]},
    });

  root.render();
  requestAnimationFrame(frame);
});

document.body.append(renderer.node());
```
