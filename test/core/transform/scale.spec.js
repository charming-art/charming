import assert from "node:assert";
import * as d3 from "d3";
import {test} from "vitest";
import "../../install-canvas-mock.js";
import * as cm from "../../../src/index.js";
import {probe} from "../../helpers.js";

function values(data, channels, options) {
  const [shape, calls] = probe();
  const root = cm.flow().renderer(cm.canvas({width: 100, height: 100, dpi: 1}));
  root.data(data).transform(cm.bind, channels).transform(cm.scale, options).append(shape);
  root.render();
  return calls[0];
}

test("cm.scale maps a channel with a linear scale and an inferred domain", () => {
  const {r} = values([1, 2, 3], {r: (d) => d}, {r: {range: [0, 10]}});
  assert.deepStrictEqual(r, [0, 5, 10]);
});

test("cm.scale infers an ordinal scale and a categorical domain for non-numeric values", () => {
  const {fill} = values(["a", "b", "a"], {fill: (d) => d}, {fill: {range: ["red", "blue"]}});
  assert.deepStrictEqual(fill, ["red", "blue", "red"]);
});

test("cm.scale supports an explicit ordinal scale for numeric values", () => {
  const {fill} = values([3, 1, 3], {fill: (d) => d}, {fill: {scale: "ordinal", range: ["red", "blue"]}});
  assert.deepStrictEqual(fill, ["red", "blue", "red"]);
});

test("cm.scale supports an explicit linear scale and domain", () => {
  const {r} = values([0, 5, 10], {r: (d) => d}, {r: {scale: "linear", domain: [0, 20], range: [0, 10]}});
  assert.deepStrictEqual(r, [0, 2.5, 5]);
});

test("cm.scale infers a linear scale for dates", () => {
  const dates = [new Date(2020, 0, 1), new Date(2020, 0, 3), new Date(2020, 0, 2)];
  const {r} = values(dates, {r: (d) => d}, {r: {range: [0, 10]}});
  assert.deepStrictEqual(r, [0, 10, 5]);
});

test("cm.scale maps equal dates to the middle of the range", () => {
  const {r} = values([new Date(0), new Date(0)], {r: (d) => d}, {r: {range: [0, 10]}});
  assert.deepStrictEqual(r, [5, 5]);
});

test("cm.scale sets the inferred domain of a d3 sequential scale", () => {
  const {fill} = values([0, 5, 10], {fill: (d) => d}, {fill: {scale: d3.scaleSequential((t) => `t=${t}`)}});
  assert.deepStrictEqual(fill, ["t=0", "t=0.5", "t=1"]);
});

test("cm.scale sets the inferred domain of a d3 continuous scale", () => {
  const {r} = values([0, 1, 4], {r: (d) => d}, {r: {scale: d3.scaleSqrt(), range: [0, 10]}});
  assert.deepStrictEqual(r, [0, 5, 10]);
});

test("cm.scale sets the inferred domain of a d3 discrete scale", () => {
  const {x} = values(["a", "b", "c"], {x: (d) => d}, {x: {scale: d3.scalePoint(), range: [0, 10]}});
  assert.deepStrictEqual(x, [0, 5, 10]);
});

test("cm.scale supports an explicit domain for a d3 scale", () => {
  const {r} = values([1, 2], {r: (d) => d}, {r: {scale: d3.scaleLinear().range([0, 10]), domain: [0, 4]}});
  assert.deepStrictEqual(r, [2.5, 5]);
});

test("cm.scale does not mutate the given d3 scale", () => {
  const scale = d3.scaleLinear();
  values([1, 2, 3], {r: (d) => d}, {r: {scale, range: [0, 10]}});
  assert.deepStrictEqual(scale.domain(), [0, 1]);
  assert.deepStrictEqual(scale.range(), [0, 1]);
});

test("cm.scale leaves channels without options unchanged", () => {
  const {r, x} = values([1, 2, 3], {r: (d) => d, x: (d) => d}, {r: {range: [0, 10]}});
  assert.deepStrictEqual(r, [0, 5, 10]);
  assert.deepStrictEqual(x, [1, 2, 3]);
});
