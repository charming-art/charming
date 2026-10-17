# Fourier Series

A square wave approximated by a [Fourier series](https://en.wikipedia.org/wiki/Fourier_series): epicycles of odd harmonics, one more every turn, whose tip traces the wave. The SVG is redrawn with [_cm_.svg](/dom#cm-svg) every frame. After the Coding Train's [Fourier Series](https://thecodingtrain.com/challenges/125-fourier-series).

```js eval code=false
const replay = Inputs.button("Replay");
```

```js eval code=false
const count = Inputs.range([1, 100], {label: "Max count", step: 1, value: 5});
```

```js eval t=example
replay;

const width = 640;
const startR = 60;
const height = startR * 5;
const startX = 180;
const startY = height / 2;
const curveX = startX + startR * 2;
const paths = Array.from({length: count}, () => []);
const color = d3.scaleLinear([0, count], [1, 0]);
const strokeWidth = d3.scaleLinear([0, count], [5, 1.5]);
const strokeOpacity = d3.scaleLinear([0, count], [0.7, 1]);
const shared = {
  stroke: (d, i) => d3.interpolatePuRd(color(i)),
  stroke_width: (d, i) => strokeWidth(i),
  stroke_opacity: (d, i) => strokeOpacity(i),
};
const line = d3
  .line()
  .x((d, i) => curveX + i)
  .y((d) => d);
const svg = cm.svg`<svg ${{width, height, viewBox: [0, 0, width, height], style_background: "black"}}></svg>`;
let time = -0.1;

requestAnimationFrame(function frame() {
  time += 0.02;
  const links = [];
  const circles = [];
  const points = [];
  const max = Math.min(count, Math.floor(time / (Math.PI * 2)) + 1);
  let px = startX;
  let py = startY;
  for (let i = 0; i < max; i++) {
    const n = i * 2 + 1;
    const radius = startR * (4 / (n * Math.PI));
    const x = px + radius * Math.cos(n * time);
    const y = py + radius * Math.sin(n * time);
    links.push({x1: px, y1: py, x2: x, y2: y});
    circles.push({x: px, y: py, r: radius});
    points.push([x, y]);
    paths[i].unshift(y);
    px = x;
    py = y;
  }
  for (const Y of paths) if (Y.length > width - curveX) Y.pop();

  svg.replaceChildren(cm.svg`<g ${{fill: "none"}}>
    <circle ${{data: circles, cx: (d) => d.x, cy: (d) => d.y, r: (d) => d.r, ...shared}}/>
    <line ${{data: links, x1: (d) => d.x1, y1: (d) => d.y1, x2: (d) => d.x2, y2: (d) => d.y2, ...shared}}/>
    <path ${{data: paths, d: line, ...shared}}/>
    <line ${{data: points, x1: (d) => d[0], y1: (d) => d[1], x2: curveX, y2: (d) => d[1], ...shared}}/>
  </g>`);

  requestAnimationFrame(frame);
});

document.body.append(svg);
```
