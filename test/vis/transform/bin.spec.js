import assert from "node:assert";
import * as d3 from "d3";
import {test} from "vitest";
import * as cm from "../../../src/index.js";

function binned(data, channels, transform, options) {
  const flow = cm.flow().data(data).transform(cm.encode, channels);
  return flow.transform((flow, data) => transform(flow, data, options))._values[0];
}

test("cm.binX bins x every interval, with the edges in x and x1, counts in y and a baseline in y1", () => {
  const data = [1, 1.5, 3, 7];
  const {value, hints, group} = binned(data, {x: (d) => d}, cm.binX, {interval: 2});
  assert.deepStrictEqual(value, {x: [0, 2, 6], x1: [2, 4, 8], y1: [0, 0, 0], y: [2, 1, 1]});
  assert.deepStrictEqual(hints.y, {label: "Frequency"});
  assert.deepStrictEqual(group, [[1, 1.5], [3], [7]]);
});

test("cm.binX drops empty bins, values without a value, and keeps the last edge in the last bin", () => {
  const {value} = binned([0, null, 10], {x: (d) => d}, cm.binX, {thresholds: [0, 5, 10]});
  assert.deepStrictEqual(value.x, [0, 5]);
  assert.deepStrictEqual(value.y, [1, 1]);
});

test("cm.binX uses Plot's auto thresholds by default: Scott's rule, with at most 200 bins", () => {
  const data = Array.from({length: 1000}, d3.randomNormal.source(d3.randomLcg(1))());
  const {value} = binned(data, {x: (d) => d}, cm.binX);
  const expected = d3
    .bin()
    .thresholds(d3.thresholdScott)(data)
    .filter((b) => b.length);
  assert.deepStrictEqual(
    value.x,
    expected.map((b) => b.x0),
  );
  assert.deepStrictEqual(
    value.y,
    expected.map((b) => b.length),
  );
});

test("cm.binX bins per series, and reduces other outputs", () => {
  const data = [
    {v: 1, s: "a", w: 2},
    {v: 1.5, s: "b", w: 3},
    {v: 1.2, s: "a", w: 4},
  ];
  const {value} = binned(data, {x: "v", fill: "s", y: "w"}, cm.binX, {y: "sum", interval: 1});
  assert.deepStrictEqual(value, {fill: ["a", "b"], x: [1, 1], x1: [2, 2], y1: [0, 0], y: [6, 3]});
});

test("cm.binX shares the edges of the bins across contexts, so that facets compare", () => {
  const contexts = cm
    .flow()
    .data([[1, 2], [9]])
    .append(cm.g)
    .data((d) => d)
    .transform(cm.encode, {x: (d) => d})
    .transform(cm.binX, {interval: 5})._values;
  assert.deepStrictEqual(
    contexts.map(({value}) => value.x),
    [[0], [5]],
  );
});

test("cm.binY bins y, with counts in x and a baseline in x1", () => {
  const {value} = binned([1, 2, 6], {y: (d) => d}, cm.binY, {interval: 5});
  assert.deepStrictEqual(value, {y: [0, 5], y1: [5, 10], x1: [0, 0], x: [2, 1]});
});

test("cm.bin bins x and y, with counts in fill", () => {
  const data = [
    [1, 1],
    [2, 2],
    [6, 1],
  ];
  const {value} = binned(data, {x: ([x]) => x, y: ([, y]) => y}, cm.bin, {interval: 5});
  assert.deepStrictEqual(value, {x: [0, 5], x1: [5, 10], y: [0, 0], y1: [5, 5], fill: [2, 1]});
});
