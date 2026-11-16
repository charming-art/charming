import assert from "node:assert";
import {test} from "vitest";
import * as cm from "../../src/index.js";

// Evaluates the position options of a modifier on a row, like .add.
function positions(options, d = {x: 0, x1: 10, y: 20, y1: 40}) {
  const keys = ["x", "x1", "y", "y1"].filter((key) => typeof options[key] === "function");
  return Object.fromEntries(keys.map((key) => [key, options[key](d, 0, [d])]));
}

test("cm.inset moves each side of the box toward the other by k pixels", () => {
  assert.deepStrictEqual(positions(cm.inset(1)), {x: 1, x1: 9, y: 21, y1: 39});
});

test("cm.inset takes a percentage of the box's size on each axis, like CSS", () => {
  assert.deepStrictEqual(positions(cm.inset("10%")), {x: 1, x1: 9, y: 22, y1: 38});
});

test("cm.inset moves sides in either order toward each other", () => {
  assert.deepStrictEqual(positions(cm.inset(1), {x: 10, x1: 0, y: 40, y1: 20}), {x: 9, x1: 1, y: 39, y1: 21});
});

test("cm.inset collapses a box thinner than the inset to its middle", () => {
  assert.deepStrictEqual(positions(cm.inset(3), {x: 0, x1: 4, y: 0, y1: 10}), {x: 2, x1: 2, y: 3, y1: 7});
});

test("cm.inset applies after the positions given in the options, and passes the other options through", () => {
  const options = cm.inset(1, {x: (d) => d.x1 * 0.5, y1: "y2", y: 30, fill: "red"});
  assert.strictEqual(options.fill, "red");
  // x is 5, then moved 1 toward x1; y1 is the channel y2, and y the constant 30.
  assert.deepStrictEqual(positions(options, {x: 0, x1: 10, y: 0, y1: 0, y2: 50}), {x: 6, x1: 9, y: 31, y1: 49});
});

test("cm.inset composes, the inner modifier first", () => {
  assert.deepStrictEqual(positions(cm.inset(1, cm.inset(2))), {x: 3, x1: 7, y: 23, y1: 37});
});

test("cm.insetX and cm.insetY inset only their own sides", () => {
  const x = cm.insetX(1, {y: 5});
  assert.deepStrictEqual(positions(x), {x: 1, x1: 9});
  assert.strictEqual(x.y, 5);
  assert.deepStrictEqual(positions(cm.insetY(1)), {y: 21, y1: 39});
});

test("cm.inset gives cm.rect and cm.circle a smaller box", () => {
  const renderer = cm.svg({width: 100, height: 100});
  const root = cm.flow().renderer(renderer);
  const flow = root.data([0]).transform(cm.bind, {x: () => 0, x1: () => 20, y: () => 0, y1: () => 20});
  flow.add(cm.rect, cm.inset(1));
  flow.add(cm.circle, cm.inset("10%"));
  root.render();
  const rect = renderer.node().querySelector("rect");
  assert.deepStrictEqual(
    ["x", "width"].map((name) => +rect.getAttribute(name)),
    [1, 18],
  );
  assert.strictEqual(+renderer.node().querySelector("circle").getAttribute("r"), 8);
});

test("cm.inset reads an array position per row, like .add", () => {
  const options = cm.inset(1, {x: [0, 4]});
  const rows = [
    {x: 9, x1: 10},
    {x: 9, x1: 10},
  ];
  assert.deepStrictEqual(
    rows.map((d, i) => options.x(d, i, rows)),
    [1, 5],
  );
});
