import assert from "node:assert";
import {test} from "vitest";
import "../../install-canvas-mock.js";
import * as cm from "../../../src/index.js";
import {probe} from "../../helpers.js";

test("flow.render() throws an error if no renderer is set", () => {
  assert.throws(() => cm.flow().render(), /No renderer/);
});

test("flow.render() renders the tree and returns the flow", () => {
  const [shape, calls] = probe();
  const root = cm.flow().renderer(cm.canvas({width: 10, height: 10}));
  root.data([1, 2]).append(shape, {x: (d) => d});
  assert.strictEqual(root.render(), root);
  assert.deepStrictEqual(calls, [{x: [1, 2]}]);
});

test("flow.render() on a child flow renders the whole tree from the root", () => {
  const [a, callsA] = probe();
  const [b, callsB] = probe();
  const root = cm.flow().renderer(cm.canvas({width: 10, height: 10}));
  root.append(a, {});
  const child = root.data([1]).append(b, {});
  child.render();
  assert.strictEqual(callsA.length, 1);
  assert.strictEqual(callsB.length, 1);
});

test("flow.render() clears the tree, so rendering again draws nothing new", () => {
  const [shape, calls] = probe();
  const root = cm.flow().renderer(cm.canvas({width: 10, height: 10}));
  root.append(shape, {});
  root.render();
  root.render();
  assert.strictEqual(calls.length, 1);
});

test("flow.render() renders children for each index of the parent in order", () => {
  const [shape, calls] = probe();
  const root = cm.flow().renderer(cm.canvas({width: 10, height: 10}));
  root
    .data(["a", "b", "c"])
    .transform(cm.bind, {x: (_, i) => i})
    .transform((_, data) => data.map((d) => ({...d, I: [2, 0]})))
    .append(cm.g)
    .append(shape, {v: (d) => d});
  root.render();
  assert.deepStrictEqual(
    calls.map((d) => d.v),
    [["c"], ["a"]],
  );
});

test("flow.render() draws each nested group under its own parent row, at any depth", () => {
  const [shape, calls] = probe();
  const root = cm.flow().renderer(cm.canvas({width: 10, height: 10}));
  const classes = [{sexes: [{n: [1]}, {n: [2, 3]}]}, {sexes: [{n: [4, 5, 6]}, {n: [7]}]}];
  root
    .data(classes)
    .append(cm.g, {x: 0, y: 0})
    .data((d) => d.sexes)
    .append(cm.g, {x: 0, y: 0})
    .data((d) => d.n)
    .append(shape, {v: (d) => d});
  root.render();
  assert.deepStrictEqual(
    calls.flatMap((d) => d.v),
    [1, 2, 3, 4, 5, 6, 7],
  );
});

test("flow.render() draws a nested flow of an array under every parent row", () => {
  const [shape, calls] = probe();
  const root = cm.flow().renderer(cm.canvas({width: 10, height: 10}));
  root
    .data([
      [1, 2],
      [3, 4, 5],
    ])
    .append(cm.g, {x: 0, y: 0})
    .data((d) => d)
    .append(cm.g, {x: 0, y: 0})
    .data(["a"])
    .append(shape, {v: (d) => d});
  root.render();
  assert.deepStrictEqual(
    calls.map((d) => d.v),
    [["a"], ["a"], ["a"], ["a"], ["a"]],
  );
});

test("flow.render() draws a composite shape once per group, without the children of other groups", () => {
  const [shape, calls] = probe();
  const composite = (flow, value) => flow.data([value.v[0]]).append(shape, {v: (d) => d});
  composite.raw = true;
  const root = cm.flow().renderer(cm.canvas({width: 10, height: 10}));
  root
    .data([
      [1, 2, 3],
      [4, 5],
    ])
    .append(cm.g, {x: 0, y: 0})
    .data((d) => d)
    .transform(cm.bind, {v: (d) => d, x: 0, y: 0})
    .append(composite);
  root.render();
  assert.deepStrictEqual(
    calls.map((d) => d.v),
    [[1], [4]],
  );
});
