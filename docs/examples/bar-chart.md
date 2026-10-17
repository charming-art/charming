# Bar Chart

The relative frequency of letters in English, drawn by a `barY` [composite shape](/shape#composite-shapes) that appends the bars and both axes, with [d3-scale](https://d3js.org/d3-scale). After the [D3 bar chart](https://observablehq.com/@d3/bar-chart/2).

```js eval t=example
const alphabet = [
  {letter: "A", frequency: 0.08167},
  {letter: "B", frequency: 0.01492},
  {letter: "C", frequency: 0.02782},
  {letter: "D", frequency: 0.04253},
  {letter: "E", frequency: 0.12702},
  {letter: "F", frequency: 0.02288},
  {letter: "G", frequency: 0.02015},
  {letter: "H", frequency: 0.06094},
  {letter: "I", frequency: 0.06966},
  {letter: "J", frequency: 0.00153},
  {letter: "K", frequency: 0.00772},
  {letter: "L", frequency: 0.04025},
  {letter: "M", frequency: 0.02406},
  {letter: "N", frequency: 0.06749},
  {letter: "O", frequency: 0.07507},
  {letter: "P", frequency: 0.01929},
  {letter: "Q", frequency: 0.00095},
  {letter: "R", frequency: 0.05987},
  {letter: "S", frequency: 0.06327},
  {letter: "T", frequency: 0.09056},
  {letter: "U", frequency: 0.02758},
  {letter: "V", frequency: 0.00978},
  {letter: "W", frequency: 0.0236},
  {letter: "X", frequency: 0.0015},
  {letter: "Y", frequency: 0.01974},
  {letter: "Z", frequency: 0.00074},
];

const width = 640;
const height = 400;
const font = {fill: "black", fontSize: 10, fontFamily: "sans-serif"};

function barY(flow, {x, y, fill = "steelblue", marginTop = 20, marginRight = 0, marginBottom = 30, marginLeft = 40}) {
  const scaleX = d3.scaleBand(x, [marginLeft, width - marginRight]).padding(0.1);
  const scaleY = d3.scaleLinear([0, d3.max(y)], [height - marginBottom, marginTop]).nice();
  const I = d3.range(x.length);

  flow.data(I).append(cm.rect, {
    x: (i) => scaleX(x[i]),
    y: (i) => scaleY(y[i]),
    width: scaleX.bandwidth(),
    height: (i) => scaleY(0) - scaleY(y[i]),
    fill,
  });
  flow
    .datum(0)
    .append(cm.group, {x: 0, y: height - marginBottom})
    .call(axisX, scaleX);
  flow.datum(0).append(cm.group, {x: marginLeft, y: 0}).call(axisY, scaleY);
}

function axisX(flow, scale) {
  const [x, x1] = scale.range();
  const tickX = (d) => scale(d) + scale.bandwidth() / 2;
  flow.append(cm.link, {x, y: 0, x1, y1: 0, stroke: "black"});
  flow.data(scale.domain()).append(cm.link, {x: tickX, y: 0, x1: tickX, y1: 4, stroke: "black"});
  flow.data(scale.domain()).append(cm.text, {
    ...font,
    text: (d) => d,
    x: tickX,
    y: 8,
    textAlign: "center",
    textBaseline: "top",
  });
}

function axisY(flow, scale) {
  const format = scale.tickFormat(10, "%");
  flow.data(scale.ticks()).append(cm.link, {x: 0, y: scale, x1: -4, y1: scale, stroke: "black"});
  flow.data(scale.ticks()).append(cm.text, {
    ...font,
    text: format,
    x: -6,
    y: scale,
    textAlign: "end",
    textBaseline: "middle",
  });
}

const renderer = cm.canvas({width, height});
const root = cm.flow().renderer(renderer);

root.data(alphabet).append(barY, {
  x: (d) => d.letter,
  y: (d) => d.frequency,
});

root.render();

document.body.append(renderer.node());
```
