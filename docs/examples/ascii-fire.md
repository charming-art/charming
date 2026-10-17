# ASCII Fire

_On Fire 🔥_: a classic fire effect on the [terminal renderer](/terminal). Each cell takes the heat of a cell below it minus a random decay, the bottom row is fed by [noise](/noise), and the heat colors the cell's background with [_cm_.mapAttrs](/transform#cm-map-attrs). Made for [Genuary 2024](https://genuary.art/prompts#jan9), "ASCII".

```js eval t=example
const cols = 80;
const rows = 30;
const fire = Array.from({length: rows}, () => new Array(cols).fill(0));
const renderer = cm.terminal({cols, rows});
const root = cm.flow().renderer(renderer);
const randomChar = () => String.fromCharCode(33 + Math.floor(Math.random() * 94));

function update() {
  const noise = cm.noise(0, rows);
  for (let y = 0; y < rows - 1; y++) {
    for (let x = 0; x < cols; x++) {
      const decay = Math.floor(Math.random() * 3);
      const spread = Math.floor(Math.random() * 2) - 1;
      const index = Math.min(Math.max(0, x - spread), cols - 1);
      fire[y][x] = Math.max(0, fire[y + 1][index] - decay);
    }
  }
  for (let x = 0; x < cols; x++) fire[rows - 1][x] = noise(x / 10) | 0;
}

function draw() {
  root.append(cm.clear, {fill: "black"});
  root
    .data(fire)
    .append(cm.group, {x: 0, y: (_, i) => i})
    .data((row) => row)
    .append(cm.point, {
      x: (_, i) => i,
      y: 0,
      stroke0: (heat) => (heat === 0 ? " " : randomChar()),
      stroke2: (heat) => (heat === 0 ? null : heat),
    })
    .transform(cm.mapAttrs, {stroke2: {domain: [0, rows], interpolate: d3.interpolateCool}});

  root.render();
}

setInterval(() => {
  update();
  draw();
}, 1000 / 15);

document.body.append(renderer.node());
```
