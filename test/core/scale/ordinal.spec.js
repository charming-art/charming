import assert from "node:assert";
import {test} from "vitest";
import * as cm from "../../../src/index.js";

test("scaleOrdinal(domain, range)(x) maps each domain value to the range value at the same index", () => {
  const x = cm.scaleOrdinal(["A", "B", "C"], ["steelblue", "yellow", "red"]);
  assert.strictEqual(x("A"), "steelblue");
  assert.strictEqual(x("B"), "yellow");
  assert.strictEqual(x("C"), "red");
});

test("scaleOrdinal(domain, range)(x) repeats the range when it is shorter than the domain", () => {
  const x = cm.scaleOrdinal(["A", "B", "C"], ["red", "blue"]);
  assert.strictEqual(x("C"), "red");
});

test("scaleOrdinal(domain, range, {unknown})(x) returns unknown for values outside the domain", () => {
  assert.strictEqual(cm.scaleOrdinal(["A"], ["red"])("Z"), undefined);
  assert.strictEqual(cm.scaleOrdinal(["A"], ["red"], {unknown: "gray"})("Z"), "gray");
});

test("scaleOrdinal.ordinal is true", () => {
  assert.strictEqual(cm.scaleOrdinal.ordinal, true);
});
