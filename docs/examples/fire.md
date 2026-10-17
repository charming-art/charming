# 火炎焱燚 (Fire)

A fire written with the characters 火, 炎, 焱 and 燚: as the heat rises and cools, small 火 grow into big 燚. The heat spreads up as in the [ASCII fire](/terminal#animating). The SVG texts are made once with [_cm_.svg](/dom#cm-svg) and updated with [_cm_.attr](/dom#cm-attr).

```js eval t=example
const cols = 32;
const rows = 20;
const font = 20;
const context = cm.context2d();
context.font = `${font}px sans-serif`;
const cell = context.measureText("火").width;
const width = cell * cols;
const height = cell * rows;
const chs = ["燚", "焱", "炎", "火"];
const fire = new Array(cols * rows).fill(0);
const index = (x, y) => x + y * cols;

const svg = cm.svg`<svg ${{width, height, viewBox: [0, 0, width, height], font_family: "sans-serif"}}>
  <text ${{
    data: fire,
    x: (_, i) => (i % cols) * cell,
    y: (_, i) => Math.floor(i / cols) * cell,
    dy: "0.8em",
  }}/>
</svg>`;
const texts = svg.querySelectorAll("text");

function update() {
  const noise = cm.noise(0, rows);
  for (let y = 0; y < rows - 1; y++) {
    for (let x = 0; x < cols; x++) {
      const decay = Math.floor(Math.random() * 3);
      const spread = Math.floor(Math.random() * 2) - 1;
      const i = Math.min(Math.max(0, x - spread), cols - 1);
      fire[index(x, y)] = Math.max(0, fire[index(i, y + 1)] - decay);
    }
  }
  for (let x = 0; x < cols; x++) fire[index(x, rows - 1)] = noise(x / 10) | 0;
}

function draw() {
  const extent = d3.extent(fire);
  const ch = d3.scaleQuantile(extent, chs);
  const fontSize = d3.scaleLinear(extent, [font, 7]);
  fire.forEach((d, i) => {
    texts[i].textContent = d ? ch(d) : "";
    cm.attr(texts[i], "font-size", fontSize(d));
  });
}

setInterval(() => {
  update();
  draw();
}, 1000 / 15);

document.body.append(svg);
```
