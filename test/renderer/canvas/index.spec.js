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
