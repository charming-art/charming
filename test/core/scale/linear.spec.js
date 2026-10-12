import assert from "node:assert";
import {test} from "vitest";
import * as cm from "../../../src/index.js";

test("scaleLinear(domain, range)(x) maps the domain to the range", () => {
  const x = cm.scaleLinear([0, 10], [0, 100]);
  assert.strictEqual(x(0), 0);
  assert.strictEqual(x(5), 50);
  assert.strictEqual(x(10), 100);
});

test("scaleLinear(domain, range)(x) extrapolates outside the domain", () => {
  const x = cm.scaleLinear([0, 10], [0, 100]);
  assert.strictEqual(x(-5), -50);
  assert.strictEqual(x(20), 200);
});

test("scaleLinear(domain, range)(x) supports a reversed range", () => {
  assert.strictEqual(cm.scaleLinear([0, 10], [100, 0])(2), 80);
});

test("scaleLinear(domain) defaults to the range [0, 1]", () => {
  assert.strictEqual(cm.scaleLinear([0, 10])(5), 0.5);
});

test("scaleLinear(domain, range)(x) returns the middle of the range for a zero-width domain", () => {
  assert.strictEqual(cm.scaleLinear([5, 5], [0, 100])(5), 50);
});

test("scaleLinear(domain, range, {unknown})(x) returns unknown for null and NaN", () => {
  const x = cm.scaleLinear([0, 10], [0, 100], {unknown: -1});
  assert.strictEqual(x(null), -1);
  assert.strictEqual(x(NaN), -1);
  assert.strictEqual(cm.scaleLinear([0, 10], [0, 100])(null), undefined);
});

test("scaleLinear(domain, range, {interpolate})(x) interpolates the normalized value", () => {
  const x = cm.scaleLinear([0, 10], [0, 1], {interpolate: (t) => `t=${t}`});
  assert.strictEqual(x(5), "t=0.5");
});
