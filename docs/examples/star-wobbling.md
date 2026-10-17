# Star Wobbling

Stars whose arms wobble: each arm is an [area](https://d3js.org/d3-shape/area) whose thickness follows a sine of position and time, redrawn as SVG every frame. A recreation of Kit Kuksenok's [p5.js stars](https://editor.p5js.org/kit-bow/sketches/vbX_VkYzH), which uses shaders instead.

```js eval code=false
const period = Inputs.range([1, 8], {label: "Period", step: 1, value: 2});
```

```js eval t=example
const size = 640;
const vector = d3.range(5);
const grid = d3.scaleBand(vector, [0, size]).padding(0.4);
const length = grid.bandwidth() / 2;
const pos = (d) => grid(d) + length;
const colors = ["#FD9DB9", "#FFD7E2", "#FFF"];
const lengths = [length, length / 1.38, length / 2.25].map(Math.floor);
const angles = d3.range(5).map((i) => ((Math.PI * 2) / 5) * i - Math.PI / 2);
const area = d3
  .area()
  .x((d) => d[0])
  .y0((d) => d[1])
  .y1((d) => -d[1]);

function arm(x, y, angle, length, fill, time) {
  const width = (length / 3) * 2;
  const scale = (t) => {
    const x1 = x + Math.cos(angle) * t * length;
    const y1 = y + Math.sin(angle) * t * length;
    const a = time / 1200 + 0.005 * x1 + y1 * 0.008;
    return 0.7 + 0.3 * Math.sin(10.0 * Math.sin(a));
  };
  const points = Array.from({length}, (_, i) => [i, (width / 2) * scale(i / length / period)]);
  return cm.svg`<g ${{transform: `rotate(${(angle * 180) / Math.PI})`, fill}}>
    <path ${{d: area(points)}}/>
    <circle ${{cx: length - 1, r: points[length - 1][1]}}/>
  </g>`;
}

const svg = cm.svg`<svg ${{width: size, height: size, viewBox: [0, 0, size, size], style_background: "rgb(255, 64, 119)"}}></svg>`;

requestAnimationFrame(function frame(time) {
  svg.replaceChildren(
    ...d3.cross(vector, vector).map(([m, n]) => {
      const x = pos(m);
      const y = pos(n);
      const arms = [0, 1, 2].flatMap((i) => angles.map((a) => arm(x, y, a, lengths[i], colors[i], time)));
      return cm.svg`<g ${{transform: `translate(${x}, ${y})`}}>${arms}</g>`;
    }),
  );
  requestAnimationFrame(frame);
});

document.body.append(svg);
```
