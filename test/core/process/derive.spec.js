import assert from "node:assert";
import {test} from "vitest";
import * as cm from "../../../src/index.js";

test("cm.derive adds constant and computed fields to copies of the data", () => {
  const data = [{a: 1}, {a: 2}];
  const flow = cm
    .flow()
    .data(data)
    .process(cm.derive, {b: (d, i) => d.a * 10 + i, c: "x"});
  assert.deepStrictEqual(flow.data(), [
    [
      {a: 1, b: 10, c: "x"},
      {a: 2, b: 21, c: "x"},
    ],
  ]);
  assert.deepStrictEqual(data, [{a: 1}, {a: 2}]);
});

test("cm.derive turns non-object data into objects with only the derived fields", () => {
  const flow = cm
    .flow()
    .data([1, 2])
    .process(cm.derive, {double: (d) => d * 2});
  assert.deepStrictEqual(flow.data(), [[{double: 2}, {double: 4}]]);
});
