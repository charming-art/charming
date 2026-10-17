# Regular Numbers

The [regular numbers](https://en.wikipedia.org/wiki/Regular_number) up to 511, numbers of the form 2<sup>i</sup>3<sup>j</sup>5<sup>k</sup>, linked to the numbers they're multiplied from, on a log scale. After [Regular numbers](https://observablehq.com/@fil/regular-numbers) by Philippe Rivière.

```js eval t=example
const N = 511;
const x = ([i, j, k]) => 0.5 * i + 2 * j - 3.6 * k;
const value = ([i, j, k]) => 2 ** i * 3 ** j * 5 ** k;
const numbers = d3
  .cross(
    d3.range(1 + Math.log(N) / Math.log(2)),
    d3.range(1 + Math.log(N) / Math.log(3)),
    d3.range(1 + Math.log(N) / Math.log(5)),
  )
  .filter((d) => value(d) <= N);
const links = numbers
  .flatMap(([i, j, k]) => [
    [
      [i - 1, j, k],
      [i, j, k],
    ],
    [
      [i, j - 1, k],
      [i, j, k],
    ],
    [
      [i, j, k - 1],
      [i, j, k],
    ],
  ])
  .filter(([n]) => Math.min(...n) >= 0);

function applyScale(flow) {
  flow.transform(cm.mapPosition, {
    scaleY: cm.scaleLog,
    padding: 15,
    domainX: d3.extent(numbers, x),
    domainY: d3.extent(numbers, value),
    reverseY: true,
  });
}

const renderer = cm.canvas({width: 640, height: 480});
const root = cm.flow().renderer(renderer);

root
  .data(links)
  .append(cm.link, {
    x: ([n]) => x(n),
    y: ([n]) => value(n),
    x1: ([, n]) => x(n),
    y1: ([, n]) => value(n),
    stroke: "lightblue",
  })
  .call(applyScale);

root.data(numbers).append(cm.circle, {x, y: value, r: 12, fill: "white", stroke: "black"}).call(applyScale);

root
  .data(numbers)
  .append(cm.text, {
    x,
    y: value,
    text: value,
    fill: "black",
    fontSize: 10,
    fontFamily: "sans-serif",
    textAlign: "center",
    textBaseline: "middle",
  })
  .call(applyScale);

root.render();

document.body.append(renderer.node());
```
