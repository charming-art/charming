# Light Up Jiggly Texts

Like [Jiggly Recursive Circles](/examples/jiggly-recursive-circles), with nested texts that light up in color. Type your own text.

```js eval code=false
const text = Inputs.text({label: "Text", value: "苏"});
```

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
const sizes = d3.range(150, 4, -15);
const color = (scheme) => d3.scaleSequential([150, 0], d3[`interpolate${scheme}`]);

const svg = cm.svg`<svg ${{width: size, height: size}}>
  <g ${{data: sizes}}>
    <text ${{
      transform: `translate(${size / 2}, ${size / 2})`,
      text_anchor: "middle",
      dominant_baseline: "middle",
      font_size: (r) => (r * 2) / Math.sqrt(text.length || 1),
      font_weight: "bold",
      fill: "black",
      stroke: "black",
      stroke_width: 0.5,
    }}>${text}</text>
  </g>
</svg>`;

function jiggle() {
  const [dx, dy] = [random(), random()];
  const fill = color(schemes[d3.randomInt(schemes.length)()]);
  d3.select(svg)
    .selectAll("g")
    .data(sizes)
    .transition()
    .duration(1000)
    .delay((d, i) => i * 20)
    .ease(d3.easeElastic)
    .attr("transform", (d, i) => `translate(${i * dx}, ${i * dy})`)
    .select("text")
    .attr("fill", (r) => fill(r));
}

setTimeout(jiggle, 500);
setInterval(jiggle, 2000);

document.body.append(svg);
```
