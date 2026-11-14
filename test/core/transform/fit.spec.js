import assert from "node:assert";
import * as d3 from "d3";
import {test} from "vitest";
import "../../install-canvas-mock.js";
import * as cm from "../../../src/index.js";
import {probe} from "../../helpers.js";

function values(data, channels, options) {
  const [shape, calls] = probe();
  const root = cm.flow().renderer(cm.canvas({width: 200, height: 100, dpi: 1}));
  root.data(data).transform(cm.bind, channels).transform(cm.fit, options).append(shape);
  root.render();
  return calls[0];
}

test("cm.fit maps x to the width and y to the height of the renderer", () => {
  const {x, y} = values([0, 1, 2], {x: (d) => d, y: (d) => d});
  assert.deepStrictEqual(x, [0, 100, 200]);
  assert.deepStrictEqual(y, [0, 50, 100]);
});

test("cm.fit also maps x1 and y1 with the same ranges", () => {
  const {x1, y1} = values([0, 1], {x: (d) => d, y: (d) => d, x1: (d) => d, y1: (d) => d});
  assert.deepStrictEqual(x1, [0, 200]);
  assert.deepStrictEqual(y1, [0, 100]);
});

test("cm.fit supports padding", () => {
  const {x, y} = values([0, 1], {x: (d) => d, y: (d) => d}, {padding: 10});
  assert.deepStrictEqual(x, [10, 190]);
  assert.deepStrictEqual(y, [10, 90]);
});

test("cm.fit supports reverseX and reverseY", () => {
  const {x, y} = values([0, 1], {x: (d) => d, y: (d) => d}, {reverseX: true, reverseY: true});
  assert.deepStrictEqual(x, [200, 0]);
  assert.deepStrictEqual(y, [100, 0]);
});

test("cm.fit shares one domain across x and x1, and across y and y1", () => {
  const {x, x1, y, y1} = values([0, 1], {x: (d) => d, x1: (d) => d + 1, y: 0, y1: (d) => d * 2});
  assert.deepStrictEqual(x, [0, 100]);
  assert.deepStrictEqual(x1, [100, 200]);
  assert.deepStrictEqual(y, [0, 0]);
  assert.deepStrictEqual(y1, [0, 100]);
});

test("cm.fit supports margins, which default to padding", () => {
  const {x, y} = values([0, 1], {x: (d) => d, y: (d) => d}, {padding: 10, marginLeft: 40, marginBottom: 30});
  assert.deepStrictEqual(x, [40, 190]);
  assert.deepStrictEqual(y, [10, 70]);
});

test("cm.fit uses the fit options hinted by earlier transforms, and explicit options override them", () => {
  const [shape, calls] = probe();
  const root = cm.flow().renderer(cm.canvas({width: 200, height: 100, dpi: 1}));
  const hint = (_, data) => data.map((d) => ({...d, fit: {reverseY: true, marginLeft: 20}}));
  const flow = root
    .data([0, 1])
    .transform(cm.bind, {x: (d) => d, y: (d) => d})
    .transform(hint);
  flow.transform(cm.fit).add(shape);
  flow.transform(cm.fit, {marginLeft: 0}).add(shape);
  root.render();
  assert.deepStrictEqual(calls[0].x, [20, 200]);
  assert.deepStrictEqual(calls[0].y, [100, 0]);
  assert.deepStrictEqual(calls[1].x, [0, 200]);
});

test("cm.fit spreads discrete values evenly across the range", () => {
  const {x, y} = values(["a", "b", "c", "b"], {x: (d) => d, y: (d) => d}, {padding: 10});
  assert.deepStrictEqual(x, [10, 100, 190, 100]);
  assert.deepStrictEqual(y, [10, 50, 90, 50]);
});

test("cm.fit centers a single discrete value", () => {
  const {x} = values(["a", "a"], {x: (d) => d});
  assert.deepStrictEqual(x, [100, 100]);
});

test("cm.fit supports a d3 scale for x and y", () => {
  const {x} = values(["a", "b"], {x: (d) => d}, {scaleX: d3.scaleBand()});
  assert.deepStrictEqual(x, [0, 100]);
});

test("cm.fit throws an error if the flow has no renderer", () => {
  assert.throws(
    () =>
      cm
        .flow()
        .data([1])
        .transform(cm.bind, {x: (d) => d})
        .transform(cm.fit),
    /No renderer/,
  );
});
