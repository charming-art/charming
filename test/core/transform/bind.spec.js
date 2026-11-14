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

test("cm.bind evaluates function channels with the datum and index", () => {
  const [shape, calls] = probe();
  render((root) =>
    root
      .data([1, 2, 3])
      .transform(cm.bind, {x: (d, i) => d * 10 + i})
      .append(shape),
  );
  assert.deepStrictEqual(calls[0].x, [10, 21, 32]);
});

test("cm.bind evaluates constant, array and cm.constant channels", () => {
  const [shape, calls] = probe();
  render((root) =>
    root
      .data(["a", "b"])
      .transform(cm.bind, {fill: "red", y: [5, 6], colors: cm.constant(["a", "b"])})
      .append(shape),
  );
  assert.deepStrictEqual(calls[0].fill, ["red", "red"]);
  assert.deepStrictEqual(calls[0].y, [5, 6]);
  assert.deepStrictEqual(calls[0].colors, ["a", "b"]);
});

test("cm.bind merges with previously bound channels", () => {
  const [shape, calls] = probe();
  render((root) =>
    root
      .data([1, 2])
      .transform(cm.bind, {x: (d) => d, y: (d) => d})
      .transform(cm.bind, {y: (d) => -d, r: 3})
      .append(shape),
  );
  assert.deepStrictEqual(calls[0], {x: [1, 2], y: [-1, -2], r: [3, 3]});
});

test("cm.bind does not mutate the bound values of the input flow", () => {
  const [shape, calls] = probe();
  render((root) => {
    const flow = root.data([1, 2]).transform(cm.bind, {x: (d) => d});
    flow.transform(cm.bind, {x: (d) => d * 10});
    flow.append(shape);
  });
  assert.deepStrictEqual(calls[0].x, [1, 2]);
});

test("cm.bind binds one group per parent instance when nested", () => {
  const [shape, calls] = probe();
  render((root) =>
    root
      .data([[1, 2], [3]])
      .transform(cm.bind, {x: 0})
      .append(cm.group)
      .data((d) => d)
      .transform(cm.bind, {v: (d) => d})
      .append(shape),
  );
  assert.deepStrictEqual(
    calls.map((d) => d.v),
    [[1, 2], [3]],
  );
});

test("cm.bind channels can be shared by sibling shapes", () => {
  const [shape, calls] = probe();
  render((root) =>
    root
      .data([0, 1])
      .transform(cm.bind, {x: (d) => d})
      .call((flow) => flow.transform(cm.fit).append(shape))
      .call((flow) => flow.append(shape)),
  );
  assert.deepStrictEqual(calls[0].x, [0, 100]);
  assert.deepStrictEqual(calls[1].x, [0, 1]);
});

test("cm.bind channels are passed as rows to the callbacks of appended options", () => {
  const [shape, calls] = probe();
  render((root) =>
    root
      .data([{price: 5}, {price: 7}])
      .transform(cm.bind, {x: (_, i) => i, width: 2})
      .append(shape, {cx: (d) => d.x + d.width / 2, price: (d) => d.datum.price}),
  );
  assert.deepStrictEqual(calls[0].cx, [1, 2]);
  assert.deepStrictEqual(calls[0].price, [5, 7]);
});

test("cm.bind channels are overridden by appended options", () => {
  const [shape, calls] = probe();
  render((root) => root.data([1, 2]).transform(cm.bind, {fill: "red"}).append(shape, {fill: "blue"}));
  assert.deepStrictEqual(calls[0].fill, ["blue", "blue"]);
});

test("cm.bind contexts keep the index returned by later transforms", () => {
  const [shape, calls] = probe();
  render((root) =>
    root
      .data([1, 2, 3])
      .transform(cm.bind, {x: (d) => d})
      .transform((_, data) => data.map((d) => ({...d, I: [2, 0]})))
      .append((flow, value) => shape(flow, {...value, I: flow.data()[0]})),
  );
  assert.deepStrictEqual(calls[0].I, [2, 0]);
});
