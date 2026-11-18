import assert from "node:assert";
import * as d3 from "d3";
import {test} from "vitest";
import * as cm from "../../../src/index.js";

// Renders lines with SVG and returns their paths.
function render(data, channels, options) {
  const renderer = cm.svg({width: 200, height: 200});
  const root = cm.flow().renderer(renderer);
  let flow = root.data(data).transform(cm.encode, channels);
  for (const transform of options?.transforms ?? []) flow = flow.transform(transform);
  flow = flow.transform(options?.coordinate ?? cm.plane, {margin: 0, ...options?.coordinateOptions});
  flow.add(options?.shape ?? cm.lineY, options?.options);
  root.render();
  return Array.from(renderer.node().querySelectorAll("path"));
}

// The points of a path of lines, as [x, y].
function pointsOf(p) {
  return p
    .getAttribute("d")
    .split(/[MLZ]/)
    .filter(Boolean)
    .map((d) => d.split(",").map(Number));
}

test("cm.lineY draws one line per series, stroked with the current color and not filled", () => {
  const data = [0, 1].flatMap((x) => ["a", "b"].map((k) => ({x, y: x, k})));
  const P = render(data, {x: "x", y: "y", z: "k"});
  assert.strictEqual(P.length, 2);
  assert.strictEqual(P[0].getAttribute("stroke"), "currentColor");
  assert.strictEqual(P[0].getAttribute("stroke-width"), "1.5");
  assert.strictEqual(P[0].getAttribute("fill"), "none");
  // Round caps and joins, like Plot, so that sharp reversals don't grow miter spikes.
  assert.strictEqual(P[0].getAttribute("stroke-linecap"), "round");
  assert.strictEqual(P[0].getAttribute("stroke-linejoin"), "round");
});

test("cm.lineY keeps series apart even if they share a color", () => {
  const data = Array.from({length: 12}, (_, k) => [0, 1].map((x) => ({x, y: x, k: `${k}`}))).flat();
  assert.strictEqual(render(data, {x: "x", y: "y", stroke: "k"}).length, 12);
});

test("cm.lineY sorts the points of each series along x", () => {
  const data = [2, 0, 1].map((x) => ({x, y: x}));
  const X = pointsOf(render(data, {x: "x", y: "y"})[0]).map(([x]) => x);
  assert.deepStrictEqual(X, [0, 100, 200]);
});

test("cm.lineY puts a row with a band at the middle of its band", () => {
  const data = ["A", "B"].map((x, i) => ({x, y: i}));
  const [p] = render(data, {x: "x", y: "y"}, {transforms: [cm.spreadX]});
  const band = d3.scaleBand(["A", "B"], [0, 200]).padding(0.1);
  const X = pointsOf(p).map(([x]) => x);
  ["A", "B"].forEach((d, i) => assert.ok(Math.abs(X[i] - (band(d) + band.bandwidth() / 2)) < 1e-3));
});

test("cm.lineY leaves a gap for rows without a value", () => {
  const data = [0, 1, 2, 3, 4].map((x) => ({x, y: x === 2 ? NaN : x}));
  assert.strictEqual(render(data, {x: "x", y: "y"})[0].getAttribute("d").match(/M/g).length, 2);
});

test("cm.lineY takes the curves of Plot by name", () => {
  const data = [0, 1, 2].map((x) => ({x, y: x % 2}));
  assert.ok(!/C/.test(render(data, {x: "x", y: "y"})[0].getAttribute("d")));
  assert.ok(/C/.test(render(data, {x: "x", y: "y"}, {options: {curve: "bump-x"}})[0].getAttribute("d")));
});

test("cm.lineX mirrors cm.lineY: one line per series along y, at x", () => {
  const data = [2, 0, 1].map((y) => ({x: y, y}));
  const [p] = render(data, {x: "x", y: "y"}, {shape: cm.lineX});
  // Sorted along y, in pixels: y = 2 at the top (y is up), then 1, then 0.
  const Y = pointsOf(p).map(([, y]) => y);
  assert.deepStrictEqual(Y, [0, 100, 200]);
});

test("cm.lineRadial draws around the center, and follows the circle at one radius", () => {
  const data = [0, 1].map((x) => ({x, y: 1}));
  const [p] = render(
    data,
    {x: "x", y: "y"},
    {
      coordinate: cm.polar,
      coordinateOptions: {endAngle: Math.PI, y: {type: "linear", domain: [0, 1]}},
      shape: cm.lineRadial,
    },
  );
  assert.strictEqual(p.getAttribute("transform"), "translate(100,100)");
  const P = pointsOf(p);
  assert.ok(P.length > 10);
  for (const [x, y] of P) assert.ok(Math.abs(Math.hypot(x, y) - 100) < 1e-2);
});

test("cm.lineY leaves a gap for missing values, such as the null of an empty cell", () => {
  const data = [0, 1, 2, 3, 4].map((x) => ({x, y: x === 2 ? null : x}));
  assert.strictEqual(render(data, {x: "x", y: "y"})[0].getAttribute("d").match(/M/g).length, 2);
});
