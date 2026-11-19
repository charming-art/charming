import assert from "node:assert";
import {test} from "vitest";
import "../../install-canvas-mock.js";
import * as cm from "../../../src/index.js";
import {probe} from "../../helpers.js";

const xs = (flow) => flow.transform(cm.bind, {x: (d) => d});

test("flow.branch(...branches) joins the contexts of the branches, so that the next transform sees them all", () => {
  let seen;
  cm
    .flow()
    .branch(
      (flow) => xs(flow.data([1, 2])),
      (flow) => xs(flow.data([3])),
    )
    .transform((_, data) => ((seen = data.map((d) => d.value.x)), data))._values;
  assert.deepStrictEqual(seen, [[1, 2], [3]]);
});

test("flow.branch(...branches) splits into one flow per branch by destructuring, after transforms", () => {
  const [a, b] = cm
    .flow()
    .branch(
      (flow) => xs(flow.data([1, 2])),
      (flow) => xs(flow.data([3])),
    )
    .transform((_, data) => data.map((d) => ({...d, value: {x: d.value.x.map((x) => x * 10)}})))
    .transform((_, data) => data);
  assert.deepStrictEqual(
    a._values.map((d) => d.value.x),
    [[10, 20]],
  );
  assert.deepStrictEqual(
    b._values.map((d) => d.value.x),
    [[30]],
  );
  assert.deepStrictEqual(a.data(), [[1, 2]]);
});

test("flow.branch(...branches) keeps the contexts of branches with many, such as nested ones", () => {
  const [a, b] = cm
    .flow()
    .data([[1], [2, 3]])
    .append(cm.g)
    .data((d) => d)
    .branch(
      (flow) => xs(flow),
      (flow) => xs(flow),
    );
  assert.strictEqual(a._values.length, 2);
  assert.strictEqual(b._values.length, 2);
});

test("flow.branch(...branches) draws the shapes of each branch with its rows, and shapes added before the split with all", () => {
  const [all, allCalls] = probe();
  const [one, oneCalls] = probe();
  const [two, twoCalls] = probe();
  const root = cm.flow().renderer(cm.canvas({width: 100, height: 100, dpi: 1}));
  const joined = root
    .branch(
      (flow) => xs(flow.data([1, 2])),
      (flow) => xs(flow.data([3])),
    )
    .add(all);
  const [a, b] = joined;
  a.add(one);
  b.add(two);
  root.render();
  assert.deepStrictEqual(
    allCalls.map((d) => d.x),
    [[1, 2], [3]],
  );
  assert.deepStrictEqual(
    oneCalls.map((d) => d.x),
    [[1, 2]],
  );
  assert.deepStrictEqual(
    twoCalls.map((d) => d.x),
    [[3]],
  );
});

test("a flow without branches iterates to itself", () => {
  const flow = cm.flow().data([1]);
  const [self] = flow;
  assert.strictEqual(self, flow);
});

test("flow.branch(...branches) throws an error for a branch that leaves the flow's level, or returns no flow", () => {
  assert.throws(
    () => cm.flow().branch((flow) => flow.data([1]).append(cm.g)),
    /Each branch must end at its flow's level: append after the join and the split/,
  );
  assert.throws(() => cm.flow().branch(() => {}), /Each branch must return its flow/);
});

test("flow.branch(...branches) throws an error for branches with and without channels", () => {
  assert.throws(
    () =>
      cm.flow().branch(
        (flow) => xs(flow.data([1])),
        (flow) => flow.data([2]),
      )._values,
    /Either every branch or none binds channels/,
  );
});

test("flow.transform throws an error for a transform that changes the number of contexts of a joined flow", () => {
  const joined = cm.flow().branch(
    (flow) => xs(flow.data([1])),
    (flow) => xs(flow.data([3])),
  );
  assert.throws(() => joined.transform((_, data) => data.slice(1))._values, /keep one context per context/);
});

test("flow.branch(...branches) throws an error for a branch of a nested flow that replaces its rows with an array", () => {
  const nested = cm
    .flow()
    .data([[1], [2]])
    .append(cm.g)
    .data((d) => d);
  assert.throws(() => nested.branch((flow) => xs(flow.data([3]))), /A branch of a nested flow keeps its rows/);
});

test("flow.branch(...branches) throws an error for appending into the joined flow before splitting it", () => {
  const joined = cm.flow().branch((flow) => xs(flow.data([1])));
  assert.throws(() => joined.append(cm.g), /Split a joined flow before appending into it/);
});

test("flow.branch(...branches) throws an error for nesting data in the joined flow before splitting it", () => {
  const joined = cm.flow().branch((flow) => xs(flow.data([[1]])));
  assert.throws(() => joined.data((d) => d), /Split a joined flow before nesting data in it/);
});
