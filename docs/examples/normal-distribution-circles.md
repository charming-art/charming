# Normal Distribution Circles

Circles placed by a [normal distribution](https://d3js.org/d3-random#randomNormal). The closer a circle is to the center, the bigger it is, with a log scale.

```js eval code=false
const replay = Inputs.button("Replay");
```

```js eval t=example
replay;

const width = 640;
const height = 240;
const random = d3.randomNormal(width / 2, 60);
const renderer = cm.canvas({width, height});
const root = cm.flow().renderer(renderer);

requestAnimationFrame(function frame() {
  const x = random();
  root
    .append(cm.circle, {
      x,
      y: height / 2,
      r: Math.abs(x - width / 2),
      fill: "black",
      fillOpacity: 0.1,
    })
    .transform(cm.mapAttrs, {
      r: {scale: cm.scaleLog, domain: [0.01, width / 2], range: [60, 10]},
    });

  root.render();
  requestAnimationFrame(frame);
});

document.body.append(renderer.node());
```
