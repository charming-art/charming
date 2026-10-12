import assert from "node:assert";
import {test} from "vitest";
import * as cm from "../../../src/index.js";

test("cm.filter keeps the data that match the predicate", () => {
  const flow = cm
    .flow()
    .data([1, 2, 3, 4])
    .process(cm.filter, (d) => d % 2 === 0);
  assert.deepStrictEqual(flow.data(), [[2, 4]]);
});

test("cm.filter filters each group independently", () => {
  const flow = cm
    .flow()
    .data([
      [1, 2],
      [3, 4],
    ])
    .data((d) => d)
    .process(cm.filter, (d, i) => i === 0);
  assert.deepStrictEqual(flow.data(), [[1], [3]]);
});
