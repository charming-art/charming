# Maze Pattern

A grid of diamonds, each split by two random diagonals, so the cells join into a maze. A variation on [10 PRINT](https://10print.org/).

```js eval code=false
const regenerate = Inputs.button("Regenerate");
```

```js eval t=example
regenerate;

const width = 640;
const count = 20;
const cols = d3.range(count);
const rows = d3.range(Math.floor(count * 0.618));
const scale = d3.scaleBand(cols, [0, width]);
const step = scale.step();
const size = step / 2;
const height = step * rows.length;
const pos = (x) => scale(x) + scale.bandwidth() / 2;
const points = [
  [0, -size],
  [size, 0],
  [0, size],
  [-size, 0],
];
const line = (i, j) => d3.line()([points[i], points[j]]);

const svg = cm.svg`<svg ${{width, height}}>
  <g ${{
    data: d3.cross(cols, rows),
    transform: ([x, y]) => `translate(${pos(x)}, ${pos(y)})`,
    stroke: "black",
    stroke_width: 2,
  }}>
    ${() => {
      const [p1, p2, q1, q2] = Math.random() > 0.5 ? [0, 3, 1, 2] : [0, 1, 2, 3];
      return cm.svg`<path ${{d: line(p1, p2)}}/><path ${{d: line(q1, q2)}}/>`;
    }}
  </g>
</svg>`;

document.body.append(svg);
```
