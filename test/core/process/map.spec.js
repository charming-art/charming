import assert from "node:assert";
import {test} from "vitest";
import * as cm from "../../../src/index.js";

test("cm.map maps each datum with the datum, index and group", () => {
  const flow = cm
    .flow()
    .data([1, 2, 3])
    .process(cm.map, (d, i, group) => d * 10 + i + group.length);
  assert.deepStrictEqual(flow.data(), [[13, 24, 35]]);
});

test("cm.map returns new groups and leaves the input unchanged", () => {
  const data = [1, 2];
  const flow = cm
    .flow()
    .data(data)
    .process(cm.map, (d) => d * 2);
  assert.deepStrictEqual(flow.data(), [[2, 4]]);
  assert.deepStrictEqual(data, [1, 2]);
});
