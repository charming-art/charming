import assert from "node:assert";
import {test} from "vitest";
import * as cm from "../../src/index.js";

test("pathRect(x, y, width, height) returns a closed rectangle", () => {
  assert.strictEqual(cm.pathRect(0, 0, 100, 50), "M 0 0 L 100 0 L 100 50 L 0 50 Z");
  assert.strictEqual(cm.pathRect(10, 20, 30, 40), "M 10 20 L 40 20 L 40 60 L 10 60 Z");
});
