import assert from "node:assert";
import {test} from "vitest";
import "../../install-canvas-mock.js";
import * as cm from "../../../src/index.js";

test("flow.call(fn, ...params) calls fn with the flow and params, and returns the flow", () => {
  const flow = cm.flow();
  const calls = [];
  assert.strictEqual(
    flow.call((...args) => calls.push(args), 1, 2),
    flow,
  );
  assert.deepStrictEqual(calls, [[flow, 1, 2]]);
});
