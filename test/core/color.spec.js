import assert from "node:assert";
import {test} from "vitest";
import {colorBytes, normalizeColor, normalizeColorString} from "../../src/core/color.js";

test("normalizeColor(color) returns transparent for none", () => {
  assert.deepStrictEqual(normalizeColor("none"), [0, 0, 0, 0]);
  assert.deepStrictEqual(normalizeColor("None", 0.5), [0, 0, 0, 0]);
  assert.deepStrictEqual(colorBytes("none"), [0, 0, 0, 0]);
});

test("normalizeColor(color) returns black for currentColor", () => {
  assert.deepStrictEqual(normalizeColor("currentColor"), [0, 0, 0, 255]);
  assert.deepStrictEqual(normalizeColor("currentcolor", 0.5), [0, 0, 0, 127]);
});

test("normalizeColorString(color) returns a CSS color for none and currentColor", () => {
  assert.strictEqual(normalizeColorString("none"), "rgba(0,0,0,0)");
  assert.strictEqual(normalizeColorString("currentColor"), "rgba(0,0,0,1)");
});
