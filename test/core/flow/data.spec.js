import assert from "node:assert";
import {test} from "vitest";
import "../../install-canvas-mock.js";
import * as cm from "../../../src/index.js";

test("flow.data() returns the groups of the flow", () => {
  assert.deepStrictEqual(cm.flow().data(), [[0]]);
});

test("flow.data(array) returns a new flow with the array as its only group", () => {
  const root = cm.flow();
  const flow = root.data([1, 2, 3]);
  assert.notStrictEqual(flow, root);
  assert.deepStrictEqual(flow.data(), [[1, 2, 3]]);
});

test("flow.data(fn) returns a new flow with one group per datum, computed by fn", () => {
  const flow = cm
    .flow()
    .data([[1, 2], [3]])
    .data((d) => d);
  assert.deepStrictEqual(flow.data(), [[1, 2], [3]]);
});

test("flow.data(fn) passes the datum, index, group and flow to fn", () => {
  const calls = [];
  const flow = cm.flow().data(["a", "b"]);
  flow.data((d, i, group, f) => (calls.push([d, i, group, f]), [d]));
  assert.deepStrictEqual(calls, [
    ["a", 0, ["a", "b"], flow],
    ["b", 1, ["a", "b"], flow],
  ]);
});
