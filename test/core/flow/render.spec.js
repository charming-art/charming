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
