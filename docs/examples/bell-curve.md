# Bell Curve

A normal distribution whose standard deviation grows and shrinks, drawn as one [line](/shape#cm-line).

```js eval t=example
const width = 640;
const height = 200;
const X = Array.from({length: width}, (_, i) => -3 + (i / (width - 1)) * 6);
const renderer = cm.canvas({width, height});
const root = cm.flow().renderer(renderer);
let sigma = 0.5;
let step = 0.01;

function bellCurve(mu, sigma) {
  const sq2pi = Math.sqrt(Math.PI * 2);
  const sdsq = sigma * sigma;
  return (x) => (1 / (sigma * sq2pi)) * Math.exp((-(x - mu) * (x - mu)) / sdsq);
}

requestAnimationFrame(function frame() {
  const curve = bellCurve(0, sigma);
  root.append(cm.clear, {fill: "white"});
  root
    .data(X)
    .append(cm.line, {
      x: (_, i) => i,
      y: (d) => curve(d),
      stroke: "black",
      strokeWidth: 2,
    })
    .transform(cm.mapPosition, {domainY: [0, 1], padding: 5, reverseY: true});

  root.render();
  sigma += step;
  if (sigma > 2 || sigma < 0.3) step *= -1;
  requestAnimationFrame(frame);
});

document.body.append(renderer.node());
```
