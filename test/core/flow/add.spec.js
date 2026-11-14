import assert from "node:assert";
import {test} from "vitest";
import "../../install-canvas-mock.js";
import * as cm from "../../../src/index.js";
import {probe} from "../../helpers.js";

function render(build) {
  const root = cm.flow().renderer(cm.canvas({width: 100, height: 100, dpi: 1}));
  build(root);
  root.render();
}

test("flow.add(shape, options) returns this flow", () => {
  const [shape] = probe();
  const flow = cm.flow().data([1, 2]);
  assert.strictEqual(flow.add(shape), flow);
});

test("flow.add(shape, options) appends siblings in order, each with its own options", () => {
  const [shape, calls] = probe();
  render((root) => root.data([1, 2]).add(shape, {fill: "red"}).add(shape, {fill: "blue"}));
  assert.deepStrictEqual(
    calls.map((d) => d.fill),
    [
      ["red", "red"],
      ["blue", "blue"],
    ],
  );
});

test("flow.add(shape, options) evaluates options for each datum of an unbound flow", () => {
  const [shape, calls] = probe();
  render((root) => root.data([1, 2, 3]).add(shape, {x: (d, i) => d * 10 + i}));
  assert.deepStrictEqual(calls[0].x, [10, 21, 32]);
});

test("flow.add(shape, options) siblings share the bound and transformed channels", () => {
  const [shape, calls] = probe();
  render((root) =>
    root
      .data([0, 1])
      .transform(cm.bind, {x: (d) => d})
      .transform(cm.fit)
      .add(shape)
      .add(shape),
  );
  assert.deepStrictEqual(calls[0].x, [0, 100]);
  assert.deepStrictEqual(calls[1].x, [0, 100]);
});

test("flow.add(shape, options) passes bound rows to callbacks and overrides bound channels", () => {
  const [shape, calls] = probe();
  render((root) =>
    root
      .data([{price: 5}, {price: 7}])
      .transform(cm.bind, {x: (_, i) => i, fill: "red"})
      .add(shape, {cx: (d) => d.x + 1, price: (d) => d.datum.price, fill: "blue"}),
  );
  assert.deepStrictEqual(calls[0].cx, [1, 2]);
  assert.deepStrictEqual(calls[0].price, [5, 7]);
  assert.deepStrictEqual(calls[0].fill, ["blue", "blue"]);
});

test("flow.add(shape, options) can be called inside a composite shape", () => {
  const [shape, calls] = probe();
  const pair = (flow, {x}) => flow.add(shape, {x}).add(shape, {x: x.map((d) => -d)});
  render((root) => root.data([1, 2]).append(pair, {x: (d) => d}));
  assert.deepStrictEqual(
    calls.map((d) => d.x),
    [
      [1, 2],
      [-1, -2],
    ],
  );
});
