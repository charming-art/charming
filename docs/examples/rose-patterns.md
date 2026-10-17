# Mathematical Rose Patterns

A table of [roses](<https://en.wikipedia.org/wiki/Rose_(mathematics)>), _r_ = cos(_n_/_d_ · θ), with _n_ along the columns and _d_ along the rows. After the Coding Train's [Mathematical Rose Patterns](https://thecodingtrain.com/challenges/55-mathematical-rose-patterns).

```js eval code=false
const count = Inputs.range([2, 20], {label: "Count", step: 1, value: 10});
```

```js eval t=example
const size = 640;
const vector = d3.range(count);
const scale = d3.scaleBand(vector, [0, size]).padding(0.1);
const r = scale.bandwidth() / 2;

function gcd(a, b) {
  return b ? gcd(b, a % b) : a;
}

function rose(n, d) {
  const k = n / d;
  const turns = d / gcd(n, d);
  const points = [];
  for (let a = 0; a < Math.PI * 2 * turns + 0.02; a += 0.02) {
    const r1 = r * Math.cos(k * a);
    points.push([r1 * Math.cos(a), r1 * Math.sin(a)]);
  }
  return d3.line()(points);
}

const svg = cm.svg`<svg ${{width: size, height: size, stroke_width: 1.2}}>
  <g ${{data: d3.cross(vector, vector), transform: ([x, y]) => `translate(${scale(x) + r}, ${scale(y) + r})`}}>
    <path ${{d: ([x, y]) => rose(x + 1, y + 1), stroke: "black", fill: "none"}}/>
  </g>
</svg>`;

document.body.append(svg);
```
