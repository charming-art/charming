import assert from "node:assert";
import {test} from "vitest";
import "../install-canvas-mock.js";
import * as cm from "../../src/index.js";
import {probe} from "../helpers.js";

test("terminal({cols, rows}) returns a renderer measured in cells", () => {
  const renderer = cm.terminal({cols: 10, rows: 5});
  assert.strictEqual(renderer._props.width, 10);
  assert.strictEqual(renderer._props.height, 5);
  assert.strictEqual(renderer._props.mode, "single");
});

test("terminal({mode}) sets the render mode", () => {
  assert.strictEqual(cm.terminal({cols: 2, rows: 2, mode: "double"})._props.mode, "double");
});

test("terminal().node() returns a canvas", () => {
  assert.ok(cm.terminal({cols: 2, rows: 2}).node() instanceof HTMLCanvasElement);
});

test("terminal() can be called several times, sharing one backend", () => {
  const a = cm.terminal({cols: 3, rows: 1});
  const b = cm.terminal({cols: 5, rows: 2});
  assert.notStrictEqual(a, b);
  assert.strictEqual(a._memory, b._memory);
  assert.strictEqual(b._props.width, 5);
});

test("terminal() works with mapPosition, which maps to cells", () => {
  const [shape, calls] = probe();
  const root = cm.flow().renderer(cm.terminal({cols: 21, rows: 11}));
  root
    .data([0, 1])
    .append(shape, {x: (d) => d, y: (d) => d})
    .transform(cm.mapPosition);
  root.render();
  assert.deepStrictEqual(calls[0].x, [0, 21]);
  assert.deepStrictEqual(calls[0].y, [0, 11]);
});

test("terminal({fontWeight}) measures cells in that font weight", () => {
  // jsdom doesn't lay out text, so make bold glyphs measure wider.
  const {getBoundingClientRect} = HTMLElement.prototype;
  HTMLElement.prototype.getBoundingClientRect = function () {
    return {width: this.style.fontWeight === "bold" ? 10 : 8, height: 16};
  };
  try {
    assert.strictEqual(cm.terminal({cols: 2, rows: 2})._props.cellWidth, 8);
    assert.strictEqual(cm.terminal({cols: 2, rows: 2, fontWeight: "bold"})._props.cellWidth, 10);
  } finally {
    HTMLElement.prototype.getBoundingClientRect = getBoundingClientRect;
  }
});
