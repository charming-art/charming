# 艹木林森 (Wood)

A tree written with the characters 森, 林, 木 and 艹, from a forest to grass: each branch is a row of characters, and splits into two smaller branches with the next character. The branches are nested SVG groups made recursively with [_cm_.svg](/dom#cm-svg).

```js eval t=example
const cols = 25;
const rows = 18;
const font = 25;
const maxDepth = 4;
const context = cm.context2d();
context.font = `${font}px sans-serif`;
const cell = context.measureText("森").width;
const width = cell * cols;
const height = cell * rows;
const chs = ["森", "林", "木", "艹"];
const fontSize = d3.scaleLinear([0, maxDepth], [font, 9]);
const degree = (x) => (x * 180) / Math.PI;

function branch(length, angle, depth) {
  if (depth >= maxDepth) return null;
  return cm.svg`<g ${{transform: `rotate(${degree(angle)})`}}>
    <text ${{
      data: d3.range(Math.round(length)),
      transform: (d) => `translate(${d * cell}, 0) rotate(90)`,
      font_size: fontSize(depth),
    }}>${chs[depth]}</text>
    <g ${{transform: `translate(${length * cell}, 0)`}}>
      ${[branch(length * 0.8, Math.PI / 6, depth + 1), branch(length * 0.8, -Math.PI / 6, depth + 1)]}
    </g>
  </g>`;
}

const svg = cm.svg`<svg ${{width, height, viewBox: [0, 0, width, height], font_family: "sans-serif", text_anchor: "middle", dominant_baseline: "central"}}>
  <g ${{transform: `translate(${width / 2}, ${height - cell / 2}) rotate(-90)`}}>
    ${branch(6, 0, 0)}
  </g>
</svg>`;

document.body.append(svg);
```
