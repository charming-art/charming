import assert from "node:assert";
import {test} from "vitest";
import * as cm from "../../../src/index.js";

test("cm.each calls the callback with the datum, index, group and flow, and keeps the groups", () => {
  const flow = cm.flow().data(["a", "b"]);
  const calls = [];
  const processed = flow.process(cm.each, (d, i, group, f) => calls.push([d, i, group, f]));
  assert.deepStrictEqual(calls, [
    ["a", 0, ["a", "b"], flow],
    ["b", 1, ["a", "b"], flow],
  ]);
  assert.strictEqual(processed.data(), flow.data());
});

test("cm.each visits every group", () => {
  const visited = [];
  cm.flow()
    .data([[1, 2], [3]])
    .data((d) => d)
    .process(cm.each, (d) => visited.push(d));
  assert.deepStrictEqual(visited, [1, 2, 3]);
});
