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

test("cm.pack with share gives cells of different shapes the same size: the largest that fits them all", () => {
  const context = (n, frame) => ({frame, group: Array.from({length: n}, (_, i) => i), value: {}});
  const [a, b] = cm.pack(
    cm.flow(),
    [context(8, {left: 0, right: 100, top: 0, bottom: 50}), context(2, {left: 0, right: 40, top: 0, bottom: 40})],
    {share: true},
  );
  // Alone, a would get 25px cells and b 20px cells; shared, both get 20px, with 5 columns in a.
  assert.deepStrictEqual(a.value.x, [0, 20, 40, 60, 80, 0, 20, 40]);
  assert.deepStrictEqual(
    a.value.x1.map((x1, i) => x1 - a.value.x[i]),
    Array(8).fill(20),
  );
  assert.deepStrictEqual(b.value.x, [0, 20]);
  assert.deepStrictEqual(b.value.y1, [40, 40]);
});

test("cm.pack with share finds the largest size that fits, even with fewer columns", () => {
  const context = (n, frame) => ({frame, group: Array.from({length: n}, (_, i) => i), value: {}});
  // 5 rows in a narrow 17 × 60 frame fit best in 1 column of 12px cells (5 × 12 = 60).
  const [a] = cm.pack(cm.flow(), [context(5, {left: 0, right: 17, top: 0, bottom: 60})], {share: true});
  assert.deepStrictEqual(a.value.x, [0, 0, 0, 0, 0]);
  assert.deepStrictEqual(a.value.x1, [12, 12, 12, 12, 12]);
});
