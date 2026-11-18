import assert from "node:assert";
import {test} from "vitest";
import "../install-canvas-mock.js";
import * as cm from "../../src/index.js";
import {withInsets} from "../../src/core/inset.js";
import {textWidth} from "../../src/core/textWidth.js";
import {assertInDelta} from "../helpers.js";

// Renders a shape with options on a 200 × 200 SVG, and returns its node.
function render(shape, options, data = [0]) {
  const renderer = cm.svg({width: 200, height: 200});
  const root = cm.flow().renderer(renderer);
  root.data(data).append(shape, options);
  root.render();
  return renderer.node();
}

// The rects of the clip paths of a node, as [x, y, width, height].
const clips = (node) =>
  Array.from(node.querySelectorAll("clipPath rect"), (r) =>
    ["x", "y", "width", "height"].map((k) => +r.getAttribute(k)),
  );

test("clip insets clip a shape to its box, less fractions from its sides", () => {
  const node = render(cm.rect, {x: 10, y: 20, width: 100, height: 40, fill: "red", clipTop: 0.5, clipLeft: 0.25});
  assert.deepStrictEqual(clips(node), [[35, 40, 75, 20]]);
  // The rect is drawn whole, in a group clipped to the rest of its box, without the insets.
  const rect = node.querySelector("g[clip-path] rect");
  assert.deepStrictEqual(
    ["x", "y", "width", "height"].map((k) => +rect.getAttribute(k)),
    [10, 20, 100, 40],
  );
  assert.strictEqual(rect.getAttribute("clipTop"), null);
});

test("clip insets of 0, the default, don't clip", () => {
  const node = render(cm.rect, {x: 10, y: 20, width: 100, height: 40, clipTop: 0});
  assert.strictEqual(node.querySelectorAll("clipPath").length, 0);
  assert.strictEqual(node.querySelector("rect").getAttribute("clipTop"), null);
});

test("clip insets take the box of a text, by its alignment and baseline, and of a stroke", () => {
  const node = render(cm.text, {
    x: 100,
    y: 50,
    text: "Hello",
    fontSize: 10,
    textAlign: "end",
    textBaseline: "top",
    clipRight: 0.5,
  });
  const w = textWidth("Hello", 10);
  const [[x, y, width, height]] = clips(node);
  assertInDelta(x, 100 - w);
  assertInDelta(width, w / 2);
  assert.deepStrictEqual([y, height], [50, 10]);
  // Half the stroke of a shape is in its box.
  const stroked = render(cm.rect, {
    x: 0,
    y: 0,
    width: 10,
    height: 10,
    stroke: "black",
    strokeWidth: 2,
    clipBottom: 0.5,
  });
  assert.deepStrictEqual(clips(stroked), [[-1, -1, 12, 6]]);
});

test("clip insets are given per row, and don't clip shapes without a box, such as paths", () => {
  const node = render(cm.rect, {x: (d) => d * 50, y: 0, width: 40, height: 100, clipTop: (d) => d / 2}, [0, 1]);
  assert.deepStrictEqual(clips(node), [[50, 50, 40, 50]]);
  const path = render(cm.path, {d: "M0,0L10,10", stroke: "black", clipTop: 0.5});
  assert.strictEqual(path.querySelectorAll("clipPath").length, 0);
});

test("clip insets keep the batches of a renderer that only draws batches, such as WebGL", () => {
  const calls = [];
  const renderer = {rects: (I) => calls.push(I)};
  const value = {x: [0], y: [0], width: [10], height: [10], clipTop: [0.5]};
  cm.rect(withInsets(renderer, [0], value), [0], value);
  assert.deepStrictEqual(calls, [[0]]);
});
