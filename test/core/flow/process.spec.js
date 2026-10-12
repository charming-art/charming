import assert from "node:assert";
import {test} from "vitest";
import "../../install-canvas-mock.js";
import * as cm from "../../../src/index.js";

test("flow.process(process, ...params) returns a new flow with the processed groups", () => {
  const flow = cm.flow().data([1, 2, 3]);
  const calls = [];
  const processed = flow.process((f, groups, a) => (calls.push([f, groups, a]), [[a]]), 9);
  assert.notStrictEqual(processed, flow);
  assert.deepStrictEqual(processed.data(), [[9]]);
  assert.deepStrictEqual(calls, [[flow, [[1, 2, 3]], 9]]);
});
