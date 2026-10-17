# Cardioid

Points around a circle, each linked to the point at _m_ times its index. With _m_ = 2, the links outline a [cardioid](https://en.wikipedia.org/wiki/Cardioid). Drawn as SVG with [_cm_.svg](/dom#cm-svg).

```js eval code=false
const n = Inputs.range([1, 200], {label: "Count", step: 1, value: 100});
```

```js eval code=false
const m = Inputs.range([2, 10], {label: "Step", step: 1, value: 2});
```

```js eval t=example
const size = 640;
const radius = size / 2 - 5;
const points = d3.range(n).map((i) => (i * Math.PI * 2) / n);
const x = (t) => radius * Math.cos(t);
const y = (t) => radius * Math.sin(t);

const svg = cm.svg`<svg ${{width: size, height: size, viewBox: [-size / 2, -size / 2, size, size]}}>
  <circle ${{cx: 0, cy: 0, r: radius, fill: "none", stroke: "black"}}/>
  <line ${{
    data: points,
    x1: x,
    y1: y,
    x2: (_, i) => x(points[(i * m) % n]),
    y2: (_, i) => y(points[(i * m) % n]),
    stroke: "black",
  }}/>
</svg>`;

document.body.append(svg);
```
