import assert from "node:assert";
import {test} from "vitest";
import "../../install-canvas-mock.js";
import * as cm from "../../../src/index.js";
import {probe} from "../../helpers.js";

test("cm.glsl`...` returns an attribute holding the source strings and interpolated values", () => {
  const scale = 300;
  const r = cm.glsl`float r(float d) { return d * ${scale}; }`;
  assert.strictEqual(r.preserve, true);
  assert.deepStrictEqual([...r.strings], ["float r(float d) { return d * ", "; }"]);
  assert.deepStrictEqual(r.params, [300]);
});

test("cm.glsl`...` attributes are passed to shapes unchanged", () => {
  const [shape, calls] = probe();
  const r = cm.glsl`float r(float d) { return d; }`;
  const root = cm.flow().renderer(cm.canvas({width: 10, height: 10}));
  root.data([1, 2]).append(shape, {r});
  root.render();
  assert.strictEqual(calls[0].r, r);
});
