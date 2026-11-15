import assert from "node:assert";
import {test} from "vitest";
import * as cm from "../../../src/index.js";

// Packs the rows of each context into a 100 × 50 frame.
function packed(groups, options) {
  const root = cm.flow().renderer(cm.svg({width: 100, height: 50}));
  return root
    .data(groups)
    .data((d) => d)
    .transform(cm.encode, {fill: "currentColor"})
    .transform(cm.plane, {margin: 0})
    .transform(cm.pack, options)._values;
}

test("cm.pack fills the frame with a grid of square cells, row by row from the bottom left", () => {
  const [{value}] = packed([[1, 2, 3, 4, 5, 6, 7, 8]]);
  // 8 cells in a 2:1 frame: 4 columns of 25px, 2 rows.
  assert.deepStrictEqual(value.x, [0, 25, 50, 75, 0, 25, 50, 75]);
  assert.deepStrictEqual(value.x1, [25, 50, 75, 100, 25, 50, 75, 100]);
  assert.deepStrictEqual(value.y1, [50, 50, 50, 50, 25, 25, 25, 25]);
  assert.deepStrictEqual(value.y, [25, 25, 25, 25, 0, 0, 0, 0]);
});

test("cm.pack adds columns until the rows fit the height", () => {
  const [{value}] = packed([[1, 2, 3]]);
  // 3 cells in a 2:1 frame: 2 columns of 50px would need 100px, so 3 columns of 33px.
  assert.ok(Math.max(...value.y1) - Math.min(...value.y) <= 50);
  assert.strictEqual(new Set(value.y).size, 1);
});

test("cm.pack with share lays out every grid for the largest count", () => {
  const [small, large] = packed(
    [
      [1, 2],
      [1, 2, 3, 4, 5, 6, 7, 8],
    ],
    {share: true},
  );
  assert.strictEqual(small.value.x1[0] - small.value.x[0], 25);
  assert.strictEqual(large.value.x1[0] - large.value.x[0], 25);
  const [alone] = packed([[1, 2]]);
  assert.strictEqual(alone.value.x1[0] - alone.value.x[0], 50);
});

test("cm.pack throws an error without channels", () => {
  assert.throws(() => cm.pack(cm.flow(), undefined), /No channels/);
});
