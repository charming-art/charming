import assert from "node:assert";
import {test} from "vitest";
import * as cm from "../../../src/index.js";

// Renders areas with SVG and returns their paths.
function render(data, channels, options) {
  const renderer = cm.svg({width: 200, height: 200});
  const root = cm.flow().renderer(renderer);
  let flow = root.data(data).transform(cm.encode, channels);
  for (const transform of options?.transforms ?? []) flow = flow.transform(transform);
  flow.transform(options?.coordinate ?? cm.plane, {margin: 0}).add(options?.shape ?? cm.areaY, options?.options);
  root.render();
  return Array.from(renderer.node().querySelectorAll("path"));
}

const rows = [
  {x: 0, y: 1, k: "a"},
  {x: 1, y: 2, k: "a"},
  {x: 0, y: 3, k: "b"},
  {x: 1, y: 4, k: "b"},
];

test("cm.areaY draws one area per series, from y1 to y", () => {
  const P = render(rows, {x: "x", y: "y", fill: "k"}, {transforms: [cm.stackY]});
  assert.strictEqual(P.length, 2);
  assert.notStrictEqual(P[0].getAttribute("fill"), P[1].getAttribute("fill"));
});

test("cm.areaY keeps series apart even if they share a color", () => {
  const data = Array.from({length: 12}, (_, k) => [0, 1].map((x) => ({x, y: 1, k}))).flat();
  const P = render(data, {x: "x", y: "y", fill: (d) => `${d.k}`}, {transforms: [cm.stackY]});
  assert.strictEqual(P.length, 12);
});

test("cm.areaY sorts the rows of each series by x", () => {
  const data = [
    {x: 1, y: 2},
    {x: 0, y: 1},
  ];
  const [p] = render(data, {x: "x", y: "y"}, {transforms: [cm.stackY]});
  // The top line starts at x = 0, on the left.
  assert.match(p.getAttribute("d"), /^M0,/);
});

test("cm.areaY goes through both edges of a band, so that it's flat across a bar", () => {
  const data = [
    {x: "A", y: 1},
    {x: "B", y: 2},
  ];
  const [p] = render(data, {x: "x", y: "y"}, {transforms: [cm.spreadX, cm.stackY]});
  // Two points per band on the top line, and two per band on the baseline: 8 points.
  assert.strictEqual(p.getAttribute("d").match(/[ML]/g).length, 8);
});

test("cm.areaY leaves a gap for rows without a value", () => {
  const data = [0, 1, 2, 3, 4].map((x) => ({x, y: x === 2 ? NaN : 1}));
  const [p] = render(data, {x: "x", y: "y"}, {transforms: [cm.stackY]});
  assert.strictEqual(p.getAttribute("d").match(/M/g).length, 2);
});

test("cm.areaY takes the curves of Plot by name", () => {
  const data = [0, 1, 2].map((x) => ({x, y: x + 1}));
  const [linear] = render(data, {x: "x", y: "y"}, {transforms: [cm.stackY]});
  const [bump] = render(data, {x: "x", y: "y"}, {transforms: [cm.stackY], options: {curve: "bump-x"}});
  assert.ok(!/C/.test(linear.getAttribute("d")));
  assert.ok(/C/.test(bump.getAttribute("d")));
});

test("cm.areaRadial draws the areas of cm.polar around the center", () => {
  const [p] = render(
    rows.slice(0, 2),
    {x: "x", y: "y"},
    {
      transforms: [cm.stackY],
      coordinate: cm.polar,
      shape: cm.areaRadial,
    },
  );
  assert.strictEqual(p.getAttribute("transform"), "translate(100,100)");
});

test("cm.areaRadial follows the circle between points at the same radius, like an arc", () => {
  const data = [0, 1].map((x) => ({x, y: 1}));
  const [p] = render(
    data,
    {x: "x", y: "y"},
    {
      transforms: [cm.stackY],
      coordinate: cm.polar,
      shape: cm.areaRadial,
      options: {curve: "linear"},
    },
  );
  // Every point of the outer edge is at the outer radius, 100.
  const points = p
    .getAttribute("d")
    .split(/[MLZ]/)
    .filter(Boolean)
    .map((d) => d.split(",").map(Number));
  const outer = points.filter(([x, y]) => Math.hypot(x, y) > 50);
  assert.ok(outer.length > 10);
  // The path is rounded to 3 decimals.
  for (const [x, y] of outer) assert.ok(Math.abs(Math.hypot(x, y) - 100) < 1e-2);
});

test("cm.areaX mirrors cm.areaY: one area per series along y, from x1 to x", () => {
  const data = [
    {y: 1, x: 2, k: "a"},
    {y: 0, x: 1, k: "a"},
    {y: 0, x: -3, k: "b"},
    {y: 1, x: -4, k: "b"},
  ];
  const P = render(data, {x: "x", y: "y", fill: "k"}, {transforms: [cm.stackX], shape: cm.areaX});
  assert.strictEqual(P.length, 2);
  // Sorted along y: each line goes from y = 1, at the top (y is up), to y = 0, at the bottom.
  for (const p of P) assert.match(p.getAttribute("d"), /^M[^,]+,0L[^,]+,200L/);
});

// The points of a path, as [x, y], for paths of lines.
function pointsOfPath(p) {
  return p
    .getAttribute("d")
    .split(/[MLZ]/)
    .filter(Boolean)
    .map((d) => d.split(",").map(Number));
}

test("cm.areaY goes through the edges of bands in order, even if the scale is reversed", () => {
  const data = ["A", "B", "C"].map((x, i) => ({x, y: i + 1}));
  const renderer = cm.svg({width: 200, height: 200});
  const root = cm.flow().renderer(renderer);
  root
    .data(data)
    .transform(cm.encode, {x: "x", y: "y"})
    .transform(cm.spreadX)
    .transform(cm.stackY)
    .transform(cm.plane, {margin: 0, scales: {x: {reverse: true}}})
    .add(cm.areaY);
  root.render();
  const [p] = renderer.node().querySelectorAll("path");
  // The top line goes through 6 points in one direction, then the baseline comes back.
  const X = pointsOfPath(p)
    .slice(0, 6)
    .map(([x]) => x);
  assert.deepStrictEqual(
    X,
    X.slice().sort((a, b) => a - b),
  );
});

test("cm.areaRadial samples curves whose control points go past their ends", () => {
  const data = [0, 1, 2, 3].map((x) => ({x, y: [1, 4, 1, 4][x]}));
  const renderer = cm.svg({width: 200, height: 200});
  const root = cm.flow().renderer(renderer);
  root
    .data(data)
    .transform(cm.encode, {x: "x", y: "y"})
    .transform(cm.stackY)
    .transform(cm.polar, {margin: 0, startAngle: 0, endAngle: 0.3, scales: {y: {type: "linear"}}})
    .add(cm.areaRadial, {curve: "natural"});
  root.render();
  const [p] = renderer.node().querySelectorAll("path");
  const P = pointsOfPath(p);
  // Consecutive points of the curves are close, so that the polyline follows them. Radial edges, at
  // a single angle, are straight lines, so they're skipped.
  for (let i = 1; i < P.length; i++) {
    const [[x0, y0], [x1, y1]] = [P[i - 1], P[i]];
    if (Math.abs(x0 * y1 - x1 * y0) < 1e-6) continue;
    assert.ok(Math.hypot(x1 - x0, y1 - y0) < 10);
  }
});

test("cm.areaY takes closed curves, which close their lines", () => {
  const data = [0, 1, 2].map((x) => ({x, y: x + 1}));
  const [p] = render(data, {x: "x", y: "y"}, {transforms: [cm.stackY], options: {curve: "linear-closed"}});
  assert.strictEqual(p.getAttribute("d").match(/Z/g).length, 2);
});
