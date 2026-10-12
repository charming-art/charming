import assert from "node:assert";
import {test} from "vitest";
import "../install-canvas-mock.js";
import * as cm from "../../src/index.js";

function fillsOf(options) {
  const renderer = cm.terminal({cols: 10, rows: 3});
  const fills = [];
  // Record the characters text draws instead of drawing them.
  Object.defineProperty(renderer, "point", {value: ({x, y, stroke}) => fills.push([x, y, stroke.fg])});
  cm.flow().renderer(renderer).append(cm.text, options).render();
  return fills;
}

test("text with a constant fill colors every character", () => {
  assert.deepStrictEqual(fillsOf({text: "ab", x: 1, y: 1, fill: "red"}), [
    [1, 1, "red"],
    [2, 1, "red"],
  ]);
});

test("text with a function fill calls it with the column, row, and size of the text", () => {
  const fill = (x, y, width, height) => `${x},${y},${width},${height}`;
  assert.deepStrictEqual(fillsOf({text: "ab", x: 1, y: 1, fill: () => fill}), [
    [1, 1, "0,0,2,1"],
    [2, 1, "1,0,2,1"],
  ]);
});
