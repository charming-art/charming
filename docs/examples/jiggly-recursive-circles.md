# Jiggly Recursive Circles

Nested circles that jiggle into a new offset and color scheme every two seconds, animated with [d3-transition](https://d3js.org/d3-transition) and an elastic ease. After Paul Buffa's [Jiggly Map](https://observablehq.com/@pstuffa/jiggly-map).

```js eval t=example
const size = 640;
const random = d3.randomUniform(-25, 25);
const schemes = [
  "Viridis",
  "Inferno",
  "Magma",
  "Plasma",
  "Warm",
  "Cool",
  "Rainbow",
  "CubehelixDefault",
  "Blues",
  "Greens",
  "Oranges",
  "Purples",
  "Reds",
  "BuPu",
  "GnBu",
  "OrRd",
  "PuRd",
  "RdPu",
  "YlGnBu",
  "YlOrRd",
];
const circles = d3.range(150, 4, -15).map((r) => ({x: size / 2, y: size / 2, r}));
const color = (scheme) => d3.scaleSequential([150, 0], d3[`interpolate${scheme}`]);

const svg = cm.svg`<svg ${{
  width: size, 
  height: size, 
  viewBox: [0, 0, size, size]}
}>
  <g ${{data: circles}}>
    <circle ${{
      cx: (d) => d.x, 
      cy: (d) => d.y, 
      r: (d) => d.r, 
      fill: (d) => color(schemes[0])(d.r), 
      stroke: "black", 
      stroke_width: 0.1}}
    />
  </g>
</svg>`;

function jiggle() {
  const [dx, dy] = [random(), random()];
  const fill = color(schemes[d3.randomInt(schemes.length)()]);
  d3.select(svg)
    .selectAll("g")
    .data(circles)
    .transition()
    .duration(1000)
    .delay((d, i) => i * 20)
    .ease(d3.easeElastic)
    .attr("transform", (d, i) => `translate(${i * dx}, ${i * dy})`)
    .select("circle")
    .attr("fill", (d) => fill(d.r));
}

jiggle();
setInterval(jiggle, 2000);

document.body.append(svg);
```
