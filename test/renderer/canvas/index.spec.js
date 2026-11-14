import assert from "node:assert";
import {test} from "vitest";
import "../../install-canvas-mock.js";
import * as cm from "../../../src/index.js";

test("cm.canvas() returns a renderer whose node is a 640×480 canvas", () => {
  const node = cm.canvas().node();
  assert.ok(node instanceof HTMLCanvasElement);
  assert.strictEqual(node.style.width, "640px");
  assert.strictEqual(node.style.height, "480px");
});

test("cm.canvas({width, height, dpi}) scales the backing store by dpi but not the CSS size", () => {
  const node = cm.canvas({width: 100, height: 50, dpi: 2}).node();
  assert.strictEqual(node.width, 200);
  assert.strictEqual(node.height, 100);
  assert.strictEqual(node.style.width, "100px");
  assert.strictEqual(node.style.height, "50px");
});

test("cm.canvas(options) records which dimensions are auto", () => {
  assert.deepStrictEqual(cm.canvas()._props.auto, {width: true, height: true});
  assert.deepStrictEqual(cm.canvas({width: 100})._props.auto, {width: false, height: true});
});

test("canvas.resize(width, height) resizes the canvas for its device pixel ratio", () => {
  const renderer = cm.canvas({width: 100, height: 50, dpi: 2});
  renderer.resize(300, 60);
  const node = renderer.node();
  assert.strictEqual(node.width, 600);
  assert.strictEqual(node.height, 120);
  assert.strictEqual(node.style.width, "300px");
  assert.strictEqual(node.style.height, "60px");
  assert.strictEqual(renderer._props.width, 300);
  assert.strictEqual(renderer._props.height, 60);
});
