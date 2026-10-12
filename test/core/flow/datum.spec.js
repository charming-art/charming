import assert from "node:assert";
import {test} from "vitest";
import "../../install-canvas-mock.js";
import * as cm from "../../../src/index.js";

test("flow.datum(d) is equivalent to flow.data([d])", () => {
  assert.deepStrictEqual(cm.flow().datum(1).data(), cm.flow().data([1]).data());
});

test("flow.datum() returns the groups of the flow", () => {
  assert.deepStrictEqual(cm.flow().data([1, 2]).datum(), [[1, 2]]);
});
