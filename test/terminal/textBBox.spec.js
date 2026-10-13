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

test('terminal().textBBox({text, figlet: true, fontFamily}) returns the box of the figlet banner, in "standard" by default', () => {
  const renderer = cm.terminal({cols: 10, rows: 5});
  assert.deepStrictEqual(renderer.textBBox({text: "Hi", figlet: true}), {x: 0, y: 0, width: 10, height: 6});
  assert.deepStrictEqual(
    renderer.textBBox({text: "Hi", figlet: true, fontFamily: "standard"}),
    renderer.textBBox({text: "Hi", figlet: true}),
  );
  assert.deepStrictEqual(renderer.textBBox({text: "Hi", figlet: true, fontFamily: "ghost"}), {
    x: 0,
    y: 0,
    width: 19,
    height: 9,
  });
});

test("terminal().textBBox({text}) counts an astral character, such as an emoji, as one cell", () => {
  const renderer = cm.terminal({cols: 10, rows: 5});
  assert.deepStrictEqual(renderer.textBBox({text: "a🚀b"}), {x: 0, y: 0, width: 3, height: 1});
});
