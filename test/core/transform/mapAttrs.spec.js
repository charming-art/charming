import assert from "node:assert";
import {test} from "vitest";
import "../../install-canvas-mock.js";
import * as cm from "../../../src/index.js";
import {probe} from "../../helpers.js";

function values(data, channels, options) {
  const [shape, calls] = probe();
  const root = cm.flow().renderer(cm.canvas({width: 100, height: 100, dpi: 1}));
  root.data(data).append(shape, channels).transform(cm.mapAttrs, options);
  root.render();
  return calls[0];
}

test("cm.mapAttrs maps a channel with a linear scale and an inferred domain", () => {
  const {r} = values([1, 2, 3], {r: (d) => d}, {r: {range: [0, 10]}});
  assert.deepStrictEqual(r, [0, 5, 10]);
});

test("cm.mapAttrs supports an explicit scale and domain", () => {
  const {r} = values([0, 1, 4], {r: (d) => d}, {r: {scale: cm.scaleSqrt, domain: [0, 4], range: [0, 10]}});
  assert.deepStrictEqual(r, [0, 5, 10]);
});

test("cm.mapAttrs infers a categorical domain for ordinal scales", () => {
  const {fill} = values(["a", "b", "a"], {fill: (d) => d}, {fill: {scale: cm.scaleOrdinal, range: ["red", "blue"]}});
  assert.deepStrictEqual(fill, ["red", "blue", "red"]);
});

test("cm.mapAttrs passes other options such as interpolate to the scale", () => {
  const {fill} = values([0, 5, 10], {fill: (d) => d}, {fill: {interpolate: (t) => `t=${t}`}});
  assert.deepStrictEqual(fill, ["t=0", "t=0.5", "t=1"]);
});

test("cm.mapAttrs leaves channels without options unchanged", () => {
  const {r, x} = values([1, 2, 3], {r: (d) => d, x: (d) => d}, {r: {range: [0, 10]}});
  assert.deepStrictEqual(r, [0, 5, 10]);
  assert.deepStrictEqual(x, [1, 2, 3]);
});
