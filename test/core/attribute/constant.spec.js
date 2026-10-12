import assert from "node:assert";
import {test} from "vitest";
import "../../install-canvas-mock.js";
import * as cm from "../../../src/index.js";
import {probe} from "../../helpers.js";

test("cm.constant(value) returns a constant attribute", () => {
  assert.deepStrictEqual(cm.constant(1), {constant: true, value: 1});
});

test("cm.constant(value) is passed to shapes unchanged instead of evaluated per datum", () => {
  const [shape, calls] = probe();
  const root = cm.flow().renderer(cm.canvas({width: 10, height: 10}));
  root.data([1, 2, 3]).append(shape, {colors: cm.constant(["red", "blue"]), axis: cm.constant(false)});
  root.render();
  assert.deepStrictEqual(calls[0].colors, ["red", "blue"]);
  assert.strictEqual(calls[0].axis, false);
});
