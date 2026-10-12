import assert from "node:assert";
import {test} from "vitest";
import "../../install-canvas-mock.js";
import * as cm from "../../../src/index.js";
import {probe} from "../../helpers.js";

function values(data, channels, options) {
  const [shape, calls] = probe();
  const root = cm.flow().renderer(cm.canvas({width: 200, height: 100, dpi: 1}));
  root.data(data).append(shape, channels).transform(cm.mapPosition, options);
  root.render();
  return calls[0];
}

test("cm.mapPosition maps x to the width and y to the height of the renderer", () => {
  const {x, y} = values([0, 1, 2], {x: (d) => d, y: (d) => d});
  assert.deepStrictEqual(x, [0, 100, 200]);
  assert.deepStrictEqual(y, [0, 50, 100]);
});

test("cm.mapPosition also maps x1 and y1 with the same ranges", () => {
  const {x1, y1} = values([0, 1], {x: (d) => d, y: (d) => d, x1: (d) => d, y1: (d) => d});
  assert.deepStrictEqual(x1, [0, 200]);
  assert.deepStrictEqual(y1, [0, 100]);
});

test("cm.mapPosition supports padding", () => {
  const {x, y} = values([0, 1], {x: (d) => d, y: (d) => d}, {padding: 10});
  assert.deepStrictEqual(x, [10, 190]);
  assert.deepStrictEqual(y, [10, 90]);
});

test("cm.mapPosition supports reverseX and reverseY", () => {
  const {x, y} = values([0, 1], {x: (d) => d, y: (d) => d}, {reverseX: true, reverseY: true});
  assert.deepStrictEqual(x, [200, 0]);
  assert.deepStrictEqual(y, [100, 0]);
});

test("cm.mapPosition throws an error if the flow has no renderer", () => {
  assert.throws(
    () =>
      cm
        .flow()
        .data([1])
        .append(cm.circle, {x: (d) => d})
        .transform(cm.mapPosition),
    /No renderer/,
  );
});
