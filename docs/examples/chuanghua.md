# Chuanghua

_Chuanghua_ (窗花) are Chinese window paper-cuts. Here, each is a [rose](<https://en.wikipedia.org/wiki/Rose_(mathematics)>) filled as a [radial area](https://d3js.org/d3-shape/radial-area) with a jagged inner edge. Click one to zoom in with [d3.interpolateZoom](https://d3js.org/d3-interpolate/zoom), and click again to zoom out.

```js eval code=false
const jagged = Inputs.toggle({label: "Jagged", value: true});
```

```js eval code=false
const stroked = Inputs.toggle({label: "Stroked", value: false});
```

```js eval code=false
const count = Inputs.range([2, 10], {label: "Count", step: 1, value: 7});
```

```js eval t=example
const width = 640;
const size = width / count;
const vector = d3.range(count);
const cells = d3.cross(vector, vector).filter(([x, y]) => x !== y);
const grid = d3.scaleBand(vector, [0, width]).padding(0.18);
const r = grid.bandwidth() / 2;
const pos = (x) => grid(x) + r;
const center = [width / 2, width / 2, width];
let current = center;
let zooming = false;

function gcd(a, b) {
  return b ? gcd(b, a % b) : a;
}

function rose(n, d) {
  const k = n / d;
  const turns = d / gcd(n, d);
  const random = d3.randomUniform(-0.1, 0.1);
  const points = [];
  for (let a = 0; a < Math.PI * 2 * turns + 0.02; a += 0.02) {
    const r2 = r * Math.cos(k * a);
    const r1 = r2 * (0.8 + (jagged ? random() : 0));
    points.push([a, r1, r2]);
  }
  return d3
    .areaRadial()
    .curve(d3.curveNatural)
    .angle((d) => d[0])
    .innerRadius((d) => d[1])
    .outerRadius((d) => d[2])(points);
}

function zoomTo(end) {
  if (zooming) return;
  zooming = true;
  const interpolator = d3.interpolateZoom(current, end);
  d3.select(view)
    .transition()
    .duration(interpolator.duration * 1.2)
    .attrTween("transform", () => (t) => {
      const [x, y, w] = interpolator(t);
      const k = width / w;
      return `translate(${width / 2 - x * k}, ${width / 2 - y * k}) scale(${k})`;
    })
    .end()
    .then(() => {
      zooming = false;
      current = end;
    });
}

const svg = cm.svg`<svg ${{width, height: width}}>
  <g>
    <g ${{
      data: cells,
      transform: ([x, y]) => `translate(${pos(x)}, ${pos(y)})`,
      style_cursor: "pointer",
      onclick: (event, node, [x, y]) => zoomTo(current === center ? [pos(x), pos(y), size] : center),
    }}>
      <path ${{d: ([x, y]) => rose(x + 1, y + 1), fill: "red", stroke: stroked ? "black" : "red"}}/>
    </g>
  </g>
</svg>`;
const view = svg.firstElementChild;

document.body.append(svg);
```
