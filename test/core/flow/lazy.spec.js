import assert from "node:assert";
import {test} from "vitest";
import "../../install-canvas-mock.js";
import * as cm from "../../../src/index.js";
import {probe} from "../../helpers.js";

const root = () => cm.flow().renderer(cm.svg({width: 100, height: 100}));

test("flow.data(fn) and flow.transform run when the flow is rendered or its rows are read, not as they're built", () => {
  const calls = [];
  const flow = root();
  const nested = flow.data([1, 2]).data((d) => (calls.push(`data ${d}`), [d]));
  const transformed = nested.transform((_, data) => (calls.push("transform"), data));
  assert.deepStrictEqual(calls, []);
  assert.deepStrictEqual(transformed.data(), [[1], [2]]);
  assert.deepStrictEqual(calls, ["data 1", "data 2", "transform"]);
});

test("flow.transform runs once, even if its values are read before the flow is rendered", () => {
  let count = 0;
  const flow = root();
  const transformed = flow
    .data([1])
    .transform(cm.bind, {x: (d) => d})
    .transform((_, data) => (count++, data));
  transformed._values;
  transformed.append(probe()[0]);
  flow.render();
  assert.strictEqual(count, 1);
});

test("the values read from a flow before it's rendered are those its shapes draw", () => {
  const [shape, calls] = probe();
  const flow = root();
  const bound = flow.data([1, 2]).transform(cm.bind, {x: (d) => d * 10});
  const [{value}] = bound._values;
  bound.append(shape);
  flow.render();
  assert.strictEqual(calls[0].x, value.x);
});

test("the steps of a flow run in the order they were built, even when a later one is read first", () => {
  const order = [];
  const flow = root();
  flow.data([1]).transform((_, data) => (order.push("a"), data));
  const b = flow.data([2]).transform((_, data) => (order.push("b"), data));
  b._values;
  assert.deepStrictEqual(order, ["a", "b"]);
});

test("a flow built but never drawn still runs when the flow renders", () => {
  let count = 0;
  const flow = root();
  flow.data([1]).transform((_, data) => (count++, data));
  flow.render();
  assert.strictEqual(count, 1);
});

test("the marks of a transform, as many as its contexts ask, are drawn where it was built, with front marks last", () => {
  const order = [];
  const shape = (name) => Object.assign((renderer, I) => order.push(`${name} ${I.length}`), {builtin: true});
  const marked = Object.assign((flow, data) => data, {
    marks: (values) => [...values.map((_, i) => [shape(`mark${i}`), {}]), [shape("front"), {}, {front: true}]],
  });
  const flow = root();
  flow
    .data([1, 2])
    .transform(cm.bind, {x: (d) => d})
    .transform(marked)
    .append(shape("added"));
  flow.render();
  assert.deepStrictEqual(order, ["mark0 2", "added 2", "front 2"]);
});

test("the errors of a transform are thrown when the flow renders, not as it's built", () => {
  const flow = root();
  assert.doesNotThrow(() => flow.data([1]).transform(cm.stackY));
  assert.throws(() => flow.render(), /No channels.*cm.stackY/);
});

test("a joined flow is split into its branches as it's built, and their rows are computed when read", () => {
  const nested = root()
    .data([[1, 2], [3]])
    .append(cm.g);
  const [a, b] = nested.branch(
    (flow) => flow.data((d) => d).transform(cm.bind, {x: (d) => d}),
    (flow) => flow.data((d) => d.map((v) => v * 10)).transform(cm.bind, {x: (d) => d}),
  );
  assert.deepStrictEqual(
    a._values.map((d) => d.value.x),
    [[1, 2], [3]],
  );
  assert.deepStrictEqual(
    b._values.map((d) => d.value.x),
    [[10, 20], [30]],
  );
});

test("the flows that a composite shape builds as it's drawn run as they're built", () => {
  const [shape, calls] = probe();
  const composite = (flow, value, {options}) => {
    flow
      .data(options.ticks)
      .transform(cm.bind, {x: (d) => d})
      .append(shape);
  };
  const flow = root();
  flow.data([0]).append(composite, {ticks: [1, 2, 3]});
  flow.render();
  assert.deepStrictEqual(calls[0].x, [1, 2, 3]);
});
