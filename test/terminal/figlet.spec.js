import assert from "node:assert";
import {test} from "vitest";
import "../install-canvas-mock.js";
import * as cm from "../../src/index.js";

test("figlet draws each datum with the terminal renderer's figlet method", () => {
  const renderer = cm.terminal({cols: 10, rows: 3});
  const calls = [];
  // Record the banners figlet draws instead of drawing them.
  Object.defineProperty(renderer, "figlet", {value: (options) => calls.push(options)});
  cm.flow()
    .renderer(renderer)
    .data(["a", "b"])
    .append(cm.figlet, {text: (d) => d, x: (_, i) => i, y: 1, fontFamily: "ghost", textAlign: "center"})
    .render();
  assert.deepStrictEqual(calls, [
    {text: "a", x: 0, y: 1, fill: undefined, textAlign: "center", textBaseline: undefined, fontFamily: "ghost"},
    {text: "b", x: 1, y: 1, fill: undefined, textAlign: "center", textBaseline: undefined, fontFamily: "ghost"},
  ]);
});

test("figlet throws an error with a renderer other than the terminal", () => {
  const root = cm.flow().renderer(cm.canvas({width: 10, height: 10}));
  root.append(cm.figlet, {text: "hi"});
  assert.throws(() => root.render(), /cm\.figlet requires the terminal renderer/);
});
