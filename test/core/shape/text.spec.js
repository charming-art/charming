import assert from "node:assert";
import {test} from "vitest";
import * as cm from "../../../src/index.js";

// Renders texts with SVG and returns their x, y, text-anchor and dominant-baseline.
function texts(data, options) {
  const renderer = cm.svg({width: 100, height: 100});
  const root = cm.flow().renderer(renderer);
  root.data(data).append(cm.text, {text: "a", ...options});
  root.render();
  return Array.from(renderer.node().querySelectorAll("text"), (t) => [
    +t.getAttribute("x"),
    +t.getAttribute("y"),
    t.getAttribute("text-anchor"),
    t.getAttribute("dominant-baseline"),
  ]);
}

test("cm.text draws texts at x and y", () => {
  assert.deepStrictEqual(texts([1], {x: 10, y: 20}), [[10, 20, null, null]]);
});

test("cm.text centers a text in the box from x to x1 and y to y1, in either order", () => {
  assert.deepStrictEqual(texts([1], {x: 10, x1: 30, y: 20, y1: 60}), [[20, 40, "middle", "central"]]);
  assert.deepStrictEqual(texts([1], {x: 30, x1: 10, y: 60, y1: 20}), [[20, 40, "middle", "central"]]);
});

test("cm.text keeps the alignment given in a box", () => {
  const options = {x: 10, x1: 30, y: 20, y1: 60, textAlign: "start", textBaseline: "top"};
  assert.deepStrictEqual(texts([1], options), [[20, 40, "start", "text-before-edge"]]);
});

test("cm.text spans a box along one position, aligned along it", () => {
  assert.deepStrictEqual(texts([1], {x: 10, x1: 30, y: 50}), [[20, 50, "middle", null]]);
  assert.deepStrictEqual(texts([1], {x: 50, y: 20, y1: 60}), [[50, 40, null, "central"]]);
});

test("cm.text is a point along a position set without its pair, even with the other bound", () => {
  const renderer = cm.svg({width: 100, height: 100});
  const root = cm.flow().renderer(renderer);
  root
    .data([{low: 10, high: 30, mid: 50}])
    .transform(cm.bind, {x: () => 20, y: (d) => d.high, y1: (d) => d.low, v: (d) => d.mid})
    .append(cm.text, {y: "v", text: "a"});
  root.render();
  const t = renderer.node().querySelector("text");
  assert.deepStrictEqual([+t.getAttribute("x"), +t.getAttribute("y")], [20, 50]);
});
