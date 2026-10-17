# Charming Logo

The Charming logo: three arcs from [d3-shape](https://d3js.org/d3-shape), drawn as SVG paths with [_cm_.svg](/dom#cm-svg).

```js eval t=example
const size = 480;
const r = size / 2;
const data = [1, 3];
const pie = (a, b) => d3.pie().sort(d3.ascending).startAngle(a).endAngle(b);
const arc = (a, b) =>
  d3
    .arc()
    .innerRadius(r * a)
    .outerRadius(r * b);
const outer = pie(Math.PI / 4, Math.PI * 2 + Math.PI / 4)(data);
const inner = pie((Math.PI / 4) * 5, Math.PI * 2 + (Math.PI / 4) * 5)(data);

const svg = cm.svg`<svg ${{width: size, height: size, viewBox: [-r, -r, size, size]}}>
  <path ${{d: arc(0.67, 1)(outer[1]), fill: "#00ADB5"}}/>
  <path ${{d: arc(0.33, 0.67)(outer[1]), fill: "#393E46"}}/>
  <path ${{d: arc(0, 0.34)(inner[0]), fill: "#393E46"}}/>
</svg>`;

document.body.append(svg);
```
