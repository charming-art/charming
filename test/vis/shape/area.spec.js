import assert from "node:assert";
import {test} from "vitest";
import * as cm from "../../../src/index.js";

// Renders areas with SVG and returns their paths.
function render(data, channels, options) {
  const renderer = cm.svg({width: 200, height: 200});
  const root = cm.flow().renderer(renderer);
  let flow = root.data(data).transform(cm.encode, channels);
  for (const transform of options?.transforms ?? []) flow = flow.transform(transform);
  flow.transform(options?.coordinate ?? cm.plane, {margin: 0}).add(options?.shape ?? cm.area, options?.options);
  root.render();
  return Array.from(renderer.node().querySelectorAll("path"));
}

const rows = [
  {x: 0, y: 1, k: "a"},
  {x: 1, y: 2, k: "a"},
  {x: 0, y: 3, k: "b"},
  {x: 1, y: 4, k: "b"},
];

test("cm.area draws one area per series, from y1 to y", () => {
  const P = render(rows, {x: "x", y: "y", fill: "k"}, {transforms: [cm.stackY]});
  assert.strictEqual(P.length, 2);
  assert.notStrictEqual(P[0].getAttribute("fill"), P[1].getAttribute("fill"));
});

test("cm.area keeps series apart even if they share a color", () => {
  const data = Array.from({length: 12}, (_, k) => [0, 1].map((x) => ({x, y: 1, k}))).flat();
  const P = render(data, {x: "x", y: "y", fill: (d) => `${d.k}`}, {transforms: [cm.stackY]});
  assert.strictEqual(P.length, 12);
});

test("cm.area sorts the rows of each series by x", () => {
  const data = [
    {x: 1, y: 2},
    {x: 0, y: 1},
  ];
  const [p] = render(data, {x: "x", y: "y"}, {transforms: [cm.stackY]});
  // The top line starts at x = 0, on the left.
  assert.match(p.getAttribute("d"), /^M0,/);
});

test("cm.area goes through both edges of a band, so that it's flat across a bar", () => {
  const data = [
    {x: "A", y: 1},
    {x: "B", y: 2},
  ];
  const [p] = render(data, {x: "x", y: "y"}, {transforms: [cm.spreadX, cm.stackY]});
  // Two points per band on the top line, and two per band on the baseline: 8 points.
  assert.strictEqual(p.getAttribute("d").match(/[ML]/g).length, 8);
});

test("cm.area leaves a gap for rows without a value", () => {
  const data = [0, 1, 2, 3, 4].map((x) => ({x, y: x === 2 ? NaN : 1}));
  const [p] = render(data, {x: "x", y: "y"}, {transforms: [cm.stackY]});
  assert.strictEqual(p.getAttribute("d").match(/M/g).length, 2);
});

test("cm.area takes the curves of Plot by name", () => {
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
