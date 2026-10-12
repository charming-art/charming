import assert from "node:assert";
import {test} from "vitest";
import * as cm from "../../src/index.js";

test("pathCircle(cx, cy, r) returns a closed circle made of two arcs", () => {
  assert.strictEqual(cm.pathCircle(10, 20, 5), "M 10 15 A 5 5 0 1 0 10 25 A 5 5 0 1 0 10 15");
});
