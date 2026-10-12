import assert from "node:assert";
import {test} from "vitest";
import * as cm from "../../../src/index.js";

test("cm.eachRight calls the callback from the last datum to the first", () => {
  const visited = [];
  cm.flow()
    .data([1, 2, 3])
    .process(cm.eachRight, (d, i) => visited.push([d, i]));
  assert.deepStrictEqual(visited, [
    [3, 2],
    [2, 1],
    [1, 0],
  ]);
});

test("cm.eachRight allows removing data while iterating", () => {
  const flow = cm
    .flow()
    .data([1, 2, 3, 4])
    .process(cm.eachRight, (d, i, group) => {
      if (d % 2 === 0) group.splice(i, 1);
    });
  assert.deepStrictEqual(flow.data(), [[1, 3]]);
});
