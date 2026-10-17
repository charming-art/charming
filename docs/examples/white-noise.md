# White Noise

Random characters flickering around a rainbow [figlet](/terminal#cm-figlet) banner, like TV static. After an [asciinema recording](https://asciinema.org/a/19919).

```js eval t=example
const cols = 80;
const rows = 24;
const renderer = cm.terminal({cols, rows, fontWeight: "bold"});
const root = cm.flow().renderer(renderer);
const cells = d3.cross(d3.range(cols), d3.range(rows)).map(([x, y]) => ({x, y, lifespan: 0}));

setInterval(() => {
  root.append(cm.clear, {fill: "black"});
  root
    .data(cells)
    .process(cm.each, (d) => {
      if (d.lifespan-- > 0) return;
      d.ch = String.fromCharCode(32 + Math.floor(Math.random() * 95));
      d.lifespan = 3 + Math.floor(Math.random() * 7);
    })
    .append(cm.point, {x: (d) => d.x, y: (d) => d.y, stroke: (d) => ({ch: d.ch})});
  root.append(cm.figlet, {
    text: "Charming",
    x: cols / 2,
    y: rows / 2,
    textAlign: "center",
    textBaseline: "middle",
    fill: () => (x, y, width) => d3.interpolateRainbow(x / width),
  });

  root.render();
}, 1000 / 20);

document.body.append(renderer.node());
```
