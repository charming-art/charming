import assert from "node:assert";
import {test} from "vitest";
import * as cm from "../../src/index.js";

test("pathLine(x1, y1, x2, y2) returns an open line segment", () => {
  assert.strictEqual(cm.pathLine(1, 2, 3, 4), "M 1 2 L 3 4");
  assert.strictEqual(cm.pathLine(0, 0, 100, 200), "M 0 0 L 100 200");
});
