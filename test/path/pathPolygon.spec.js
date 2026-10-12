import assert from "node:assert";
import {test} from "vitest";
import * as cm from "../../src/index.js";

test("pathPolygon(points) returns a closed path through all points", () => {
  const points = [
    [0, 0],
    [10, 0],
    [5, 10],
  ];
  assert.strictEqual(cm.pathPolygon(points), "M 0 0 L 10 0 L 5 10 Z");
});
