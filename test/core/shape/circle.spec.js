import assert from "node:assert";
import {test} from "vitest";
import * as cm from "../../../src/index.js";

// Renders circles with SVG and returns their [cx, cy, r].
function circles(data, options) {
  const renderer = cm.svg({width: 100, height: 100});
  const root = cm.flow().renderer(renderer);
  root.data(data).append(cm.circle, options);
  root.render();
  return Array.from(renderer.node().querySelectorAll("circle"), (c) =>
    ["cx", "cy", "r"].map((k) => +c.getAttribute(k)),
  );
}

test("cm.circle draws circles at x and y with a radius r", () => {
  assert.deepStrictEqual(circles([1], {x: 10, y: 20, r: 5}), [[10, 20, 5]]);
});

test("cm.circle centers a circle in the box from x to x1 and y to y1, fitting it without r", () => {
  assert.deepStrictEqual(circles([1], {x: 10, x1: 30, y: 20, y1: 60}), [[20, 40, 10]]);
  // In either order, like cm.rect.
  assert.deepStrictEqual(circles([1], {x: 30, x1: 10, y: 60, y1: 20}), [[20, 40, 10]]);
});

test("cm.circle keeps its radius r in the box", () => {
  assert.deepStrictEqual(circles([1], {x: 10, x1: 30, y: 20, y1: 60, r: 3}), [[20, 40, 3]]);
});

test("cm.circle spans a box along one position", () => {
  assert.deepStrictEqual(circles([1], {x: 10, x1: 30, y: 50}), [[20, 50, 10]]);
  assert.deepStrictEqual(circles([1], {x: 50, y: 20, y1: 60}), [[50, 40, 20]]);
});

test("cm.circle is a point along a position set without its pair, even with the other bound", () => {
  const renderer = cm.svg({width: 100, height: 100});
  const root = cm.flow().renderer(renderer);
  root
    .data([{low: 10, high: 30, mid: 50}])
    .transform(cm.bind, {x: () => 20, y: (d) => d.high, y1: (d) => d.low, v: (d) => d.mid})
    .append(cm.circle, {y: "v", r: 2});
  root.render();
  const c = renderer.node().querySelector("circle");
  assert.deepStrictEqual(
    ["cx", "cy", "r"].map((k) => +c.getAttribute(k)),
    [20, 50, 2],
  );
});
