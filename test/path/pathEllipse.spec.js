import assert from "node:assert";
import {test} from "vitest";
import * as cm from "../../src/index.js";

test("pathEllipse(cx, cy, rx, ry) returns a closed ellipse made of two elliptical arcs", () => {
  assert.strictEqual(cm.pathEllipse(100, 100, 30, 40), "M 100 60 A 30 40 0 1 0 100 140 A 30 40 0 1 0 100 60");
});
