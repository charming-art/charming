import assert from "node:assert";
import {afterEach, beforeEach, test, vi} from "vitest";
import * as cm from "../../../src/index.js";
import {pack, sortByPosition} from "../../../src/core/transition/morph.js";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

// A flow with linear transitions of 160ms on a 200 × 200 SVG, so that 80ms is halfway.
function chart() {
  const renderer = cm.svg({width: 200, height: 200});
  const root = cm.flow({transition: {duration: 160, ease: "linear"}}).renderer(renderer);
  return [root, renderer];
}

const names = (renderer) => Array.from(renderer.node().children, (node) => node.localName);

test("pack(box, count) cuts a box into equal pieces in rows, with columns for its aspect", () => {
  assert.deepStrictEqual(pack([0, 0, 90, 30], 3), [
    [0, 0, 30, 30],
    [30, 0, 30, 30],
    [60, 0, 30, 30],
  ]);
  // Five pieces of a square: three columns, two rows, the last row as wide as the others.
  const pieces = pack([0, 0, 60, 60], 5);
  assert.strictEqual(pieces.length, 5);
  for (const [, , w, h] of pieces) assert.deepStrictEqual([w, h], [20, 30]);
  assert.deepStrictEqual(pieces[4], [20, 30, 20, 30]);
});

test("sortByPosition(primitives) orders primitives top to bottom, then left to right", () => {
  const at = (x, y) => ({type: "circle", attrs: {x, y, r: 1}, ops: []});
  const [a, b, c] = [at(50, 10), at(10, 10), at(0, 50)];
  assert.deepStrictEqual(sortByPosition([a, b, c]), [b, a, c]);
});

test("a mark of another type morphs into the new one: a path in between, the new shape at the end", () => {
  const [root, renderer] = chart();
  root.append(cm.rect, {x: 0, y: 0, width: 40, height: 40, key: "a", fill: "red"});
  root.render();
  root.append(cm.circle, {x: 100, y: 100, r: 20, key: "a", fill: "blue"});
  root.render();
  vi.advanceTimersByTime(80);
  assert.deepStrictEqual(names(renderer), ["path"]);
  const path = renderer.node().querySelector("path");
  assert.strictEqual(path.getAttribute("fill"), "rgb(128, 0, 128)");
  // Every point is between the square and the circle, about halfway.
  const xs = path
    .getAttribute("d")
    .match(/-?[\d.]+/g)
    .map(Number)
    .filter((_, i) => i % 2 === 0);
  for (const x of xs) assert.ok(x > 35 && x < 115, x);
  vi.advanceTimersByTime(96);
  assert.deepStrictEqual(names(renderer), ["circle"]);
});

test("marks split from a mark of another type through equal pieces of its box, in order of position", () => {
  const [root, renderer] = chart();
  root.append(cm.rect, {x: 0, y: 0, width: 60, height: 20, key: "A"});
  root.render();
  root.data([2, 0, 1]).append(cm.circle, {x: (d) => 50 + d * 50, y: 150, r: 5, groupKey: "A"});
  root.render();
  vi.advanceTimersByTime(0);
  // Each circle starts as a 20 × 20 piece: the first piece goes to the leftmost circle.
  const starts = Array.from(renderer.node().querySelectorAll("path"), (path) => {
    const xs = path
      .getAttribute("d")
      .match(/-?[\d.]+/g)
      .map(Number)
      .filter((_, i) => i % 2 === 0);
    return [Math.round(Math.min(...xs)), Math.round(Math.max(...xs))];
  });
  assert.deepStrictEqual(starts, [
    [40, 60],
    [0, 20],
    [20, 40],
  ]);
  vi.advanceTimersByTime(176);
  assert.deepStrictEqual(names(renderer), ["circle", "circle", "circle"]);
});

test("marks of another type merge into pieces of a mark, which appears once they've arrived", () => {
  const [root, renderer] = chart();
  root.data([0, 1, 2]).append(cm.circle, {x: (d) => 50 + d * 50, y: 150, r: 5, groupKey: "A"});
  root.render();
  root.append(cm.rect, {x: 0, y: 0, width: 60, height: 20, key: "A"});
  root.render();
  vi.advanceTimersByTime(80);
  assert.deepStrictEqual(names(renderer), ["path", "path", "path"]);
  vi.advanceTimersByTime(96);
  assert.deepStrictEqual(names(renderer), ["rect"]);
});

test("a render during a morph starts from the shape as shown", () => {
  const [root, renderer] = chart();
  root.append(cm.rect, {x: 0, y: 0, width: 40, height: 40, key: "a"});
  root.render();
  root.append(cm.circle, {x: 100, y: 100, r: 20, key: "a"});
  root.render();
  vi.advanceTimersByTime(80);
  const box = () => {
    const values = renderer
      .node()
      .querySelector("path")
      .getAttribute("d")
      .match(/-?[\d.]+/g)
      .map(Number);
    const xs = values.filter((_, i) => i % 2 === 0);
    const ys = values.filter((_, i) => i % 2 === 1);
    return [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  };
  const shown = box();
  root.append(cm.circle, {x: 100, y: 100, r: 20, key: "a"});
  root.render();
  // The new morph starts from the shape shown, resampled, not from the square or the circle.
  const start = box();
  for (let i = 0; i < 4; i++) assert.ok(Math.abs(start[i] - shown[i]) < 0.5, `${start} ${shown}`);
});

test("marks of the same type still interpolate their attributes", () => {
  const [root, renderer] = chart();
  root.append(cm.rect, {x: 0, y: 0, width: 40, height: 40, key: "a"});
  root.render();
  root.append(cm.rect, {x: 100, y: 0, width: 40, height: 40, key: "a"});
  root.render();
  vi.advanceTimersByTime(80);
  assert.deepStrictEqual(names(renderer), ["rect"]);
  assert.strictEqual(+renderer.node().querySelector("rect").getAttribute("x"), 50);
});

test("a morph paints like the shapes: black when they have no fill, and a point's black stroke", () => {
  const [root, renderer] = chart();
  root.append(cm.rect, {x: 0, y: 0, width: 40, height: 40, key: "a"});
  root.render();
  root.append(cm.point, {x: 100, y: 100, key: "a"});
  root.render();
  vi.advanceTimersByTime(80);
  const path = renderer.node().querySelector("path");
  assert.strictEqual(path.getAttribute("fill"), "black");
  // The rect has no stroke, so the point's stroke fades in.
  assert.strictEqual(path.getAttribute("stroke"), "#000");
  assert.strictEqual(+path.getAttribute("stroke-opacity"), 0.5);
});

test("pieces of a rect with an anchor or a rotation morph rather than interpolate", () => {
  const [root, renderer] = chart();
  root.data([0]).append(cm.rect, {x: 30, y: 30, width: 60, height: 60, key: "A"});
  root.render();
  root
    .data([0, 1])
    .append(cm.rect, {x: (d) => 50 + d * 100, y: 150, width: 20, height: 20, anchor: "center", groupKey: "A"});
  root.render();
  vi.advanceTimersByTime(80);
  assert.deepStrictEqual(names(renderer), ["path", "path"]);
});
