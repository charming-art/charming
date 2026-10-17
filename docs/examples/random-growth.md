# Random Growth

Each frame, a random bar grows by one pixel. Over time, the bars even out.

```js eval code=false
const replay = Inputs.button("Replay");
```

```js eval t=example
replay;

const width = 640;
const height = 200;
const N = new Array(16).fill(0);
const step = width / N.length;
const renderer = cm.canvas({width, height});
const root = cm.flow().renderer(renderer);

requestAnimationFrame(function frame() {
  N[Math.floor(Math.random() * N.length)] += 1;
  root.append(cm.clear, {fill: "white"});
  root.data(N).append(cm.rect, {
    x: (_, i) => i * step,
    y: (d) => height - d,
    width: step - 2,
    height: (d) => d,
    fill: "rgb(127, 127, 127)",
    stroke: "black",
  });

  root.render();
  if (Math.max(...N) < height) requestAnimationFrame(frame);
});

document.body.append(renderer.node());
```
