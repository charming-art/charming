import assert from "node:assert";
import {test} from "vitest";
import * as cm from "../../../src/index.js";

test("cm.push appends a value to each group", () => {
  const flow = cm.flow().data([1, 2]).process(cm.push, 3);
  assert.deepStrictEqual(flow.data(), [[1, 2, 3]]);
});

test("cm.push appends the result of a function called with the group", () => {
  const flow = cm
    .flow()
    .data([1, 2])
    .process(cm.push, (group) => group.length + 1);
  assert.deepStrictEqual(flow.data(), [[1, 2, 3]]);
});
