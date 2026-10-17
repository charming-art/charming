# Flow Noise

A flow field: a grid of arrows rotated by [noise](/noise). The arrow is a [composite shape](/shape#composite-shapes) made of three links.

```js eval t=example
const width = 640;
const height = 240;
const size = 16;
const cols = width / size;
const rows = height / size;
const noise = cm.noise();
const fields = d3.cross(d3.range(cols), d3.range(rows)).map(([x, y]) => ({x, y, value: noise(y * 0.1, x * 0.1)}));

function arrow(flow, {length, angle, x, y, rotate}) {
  const group = flow.append(cm.group, {x, y, rotate});
  const l1 = length.map((d) => d / 2);
  const l2 = length.map((d) => -d / 2);
  group.append(cm.link, {x: l2, y: 0, x1: l1, y1: 0});
  group.append(cm.link, {x: 0, y: 0, x1: l1, y1: 0, rotate: angle, transformOrigin: "end"});
  group.append(cm.link, {x: 0, y: 0, x1: l1, y1: 0, rotate: -angle, transformOrigin: "end"});
}

const renderer = cm.canvas({width, height});
const root = cm.flow().renderer(renderer);

root
  .data(fields)
  .append(arrow, {
    x: (d) => d.x * size + size / 2,
    y: (d) => d.y * size + size / 2,
    length: size * 0.8,
    angle: cm.constant(Math.PI / 6),
    rotate: (d) => d.value,
  })
  .transform(cm.mapAttrs, {rotate: {range: [0, Math.PI * 2]}});

root.render();

document.body.append(renderer.node());
```
