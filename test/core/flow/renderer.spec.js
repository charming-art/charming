import assert from "node:assert";
import {test} from "vitest";
import "../../install-canvas-mock.js";
import * as cm from "../../../src/index.js";

test("flow.renderer() returns null by default", () => {
  assert.strictEqual(cm.flow().renderer(), null);
});

test("flow.renderer(renderer) sets the renderer and returns the flow", () => {
  const flow = cm.flow();
  const renderer = cm.canvas({width: 10, height: 10});
  assert.strictEqual(flow.renderer(renderer), flow);
  assert.strictEqual(flow.renderer(), renderer);
});

test("flow.renderer(renderer) is shared by all flows derived from the same root", () => {
  const root = cm.flow();
  const child = root.data([1, 2]).append(cm.circle, {});
  const renderer = cm.canvas({width: 10, height: 10});
  child.renderer(renderer);
  assert.strictEqual(root.renderer(), renderer);
  assert.strictEqual(root.data([3]).renderer(), renderer);
});
