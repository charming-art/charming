import assert from "node:assert";
import {test} from "vitest";
import "../install-canvas-mock.js";
import * as cm from "../../src/index.js";

test("terminal().textBBox({text}) returns the box of plain text, one cell per character", () => {
  const renderer = cm.terminal({cols: 10, rows: 5});
  assert.deepStrictEqual(renderer.textBBox({text: "abc"}), {x: 0, y: 0, width: 3, height: 1});
});

test("terminal().textBBox({text, x, y, textAlign, textBaseline}) aligns the box", () => {
  const renderer = cm.terminal({cols: 10, rows: 5});
  assert.deepStrictEqual(renderer.textBBox({text: "abc", x: 5, y: 2, textAlign: "center", textBaseline: "middle"}), {
    x: 3.5,
    y: 1.5,
    width: 3,
    height: 1,
  });
  assert.deepStrictEqual(renderer.textBBox({text: "abc", x: 5, y: 2, textAlign: "end", textBaseline: "bottom"}), {
    x: 2,
    y: 1,
    width: 3,
    height: 1,
  });
});

test('terminal().textBBox({text: figlet(text), fontFamily}) uses the named figlet font, "standard" by default', () => {
  const renderer = cm.terminal({cols: 10, rows: 5});
  assert.deepStrictEqual(renderer.textBBox({text: cm.figlet("Hi")}), {x: 0, y: 0, width: 10, height: 6});
  assert.deepStrictEqual(
    renderer.textBBox({text: cm.figlet("Hi"), fontFamily: "standard"}),
    renderer.textBBox({text: cm.figlet("Hi")}),
  );
  assert.deepStrictEqual(renderer.textBBox({text: cm.figlet("Hi"), fontFamily: "ghost"}), {
    x: 0,
    y: 0,
    width: 19,
    height: 9,
  });
});
