import assert from "node:assert";
import {test} from "vitest";
import "../../install-canvas-mock.js";
import * as cm from "../../../src/index.js";
import {probe} from "../../helpers.js";

function values(data, options) {
  const [shape, calls] = probe();
  const root = cm.flow().renderer(cm.canvas({width: 100, height: 100, dpi: 1}));
  root.data(data).transform(cm.encode, options).add(shape);
  root.render();
  return calls[0];
}

const data = [
  {letter: "A", frequency: 0.08, color: "steelblue"},
  {letter: "B", frequency: 0.01, color: "orange"},
];

test("cm.encode(options) treats strings as field names", () => {
  const {x, y} = values(data, {x: "letter", y: "frequency"});
  assert.deepStrictEqual(x, ["A", "B"]);
  assert.deepStrictEqual(y, [0.08, 0.01]);
});

test("cm.encode(options) treats fill and stroke colors as constants", () => {
  const {fill, stroke} = values(data, {fill: "red", stroke: "none"});
  assert.deepStrictEqual(fill, ["red", "red"]);
  assert.deepStrictEqual(stroke, ["none", "none"]);
});

test("cm.encode(options) treats fill and stroke strings that are not colors as field names", () => {
  const {fill} = values(data, {fill: "color"});
  assert.deepStrictEqual(fill, ["steelblue", "orange"]);
});

test("cm.encode(options) evaluates functions and constants like cm.bind", () => {
  const {x, r} = values(data, {x: (d, i) => d.letter + i, r: 3});
  assert.deepStrictEqual(x, ["A0", "B1"]);
  assert.deepStrictEqual(r, [3, 3]);
});
