# Terminal Bar Chart

A horizontal bar chart drawn with characters: a `barX` [composite shape](/shape#composite-shapes) appends the title, the grid lines, the axis and the bars, with a [figlet](/terminal#cm-figlet) banner as an annotation.

```js eval t=example
const data = [1.9, 1.9, 1.6, 1.0, 0.4, 0.1];
const step = 3;
const marginX = 3;
const marginY = 3;
const plotWidth = 60;
const plotHeight = step * data.length;
const colors = ["#CC4A6A", "#6EBD41", "#D6B152", "#56ADD3", "#AC5ADA", "#7DDEBB"];
const renderer = cm.terminal({cols: plotWidth + marginX * 2, rows: plotHeight + marginY * 2});
const root = cm.flow().renderer(renderer);

function barX(flow, {x: X, y: Y, width, height, title}) {
  const scaleX = d3.scaleLinear([0, d3.max(X)], [0, width]).nice();
  const ticks = scaleX.ticks(5);

  flow.datum(0).append(cm.text, {text: title, x: width / 2, y: -1, textAlign: "center", textBaseline: "bottom"});

  const axis = flow.datum(0).append(cm.group, {x: 0, y: height});
  axis.data(ticks).append(cm.link, {x: scaleX, x1: scaleX, y: 0, y1: -height - 1, stroke: {ch: ":"}});
  axis.append(cm.link, {x: 0, x1: width, y: 0, y1: 0, stroke: {ch: "-"}});
  axis.data(ticks).append(cm.text, {text: (d) => d.toFixed(1), x: scaleX, y: 1, textAlign: "center"});

  flow.data(X).append(cm.rect, {
    x: 0,
    y: (_, i) => Y[i] * step,
    width: scaleX,
    height: step - 1,
    fill: (_, i) => ({ch: "#", fg: colors[i % colors.length]}),
  });
}

root
  .append(cm.group, {x: marginX, y: marginY})
  .data(data)
  .append(barX, {
    x: (d) => d,
    y: (_, i) => i,
    width: cm.constant(plotWidth),
    height: cm.constant(plotHeight),
    title: cm.constant("Terminal Bar Chart"),
  });

root.append(cm.figlet, {
  text: "2023",
  x: marginX + plotWidth,
  y: marginY + plotHeight,
  textAlign: "end",
  textBaseline: "bottom",
});

root.render();

document.body.append(renderer.node());
```
