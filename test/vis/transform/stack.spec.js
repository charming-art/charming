import assert from "node:assert";
import * as d3 from "d3";
import {test} from "vitest";
import "../../install-canvas-mock.js";
import * as cm from "../../../src/index.js";
import {assertInDelta} from "../../helpers.js";

function values(data, channels, ...transforms) {
  let flow = cm.flow().data(data).transform(cm.encode, channels);
  for (const transform of transforms) flow = flow.transform(transform);
  return flow._values[0].value;
}

function assertAllInDelta(actual, expected) {
  assert.strictEqual(actual.length, expected.length);
  actual.forEach((d, i) => assertInDelta(d, expected[i]));
}

const data = [
  {state: "A", age: "a", n: 1},
  {state: "A", age: "b", n: 2},
  {state: "B", age: "a", n: 3},
];

test("cm.stackY sums y per x band in input order, for stacked columns", () => {
  const {y, y1} = values(data, {x: "state", y: "n", fill: "age"}, cm.spreadX, cm.stackY);
  assert.deepStrictEqual(y1, [0, 1, 0]);
  assert.deepStrictEqual(y, [1, 3, 3]);
});

test("cm.stackY stacks negative values down from 0, and skips rows without a value", () => {
  const rows = [2, -1, null, 3, -2, undefined].map((n) => ({n}));
  const {y, y1} = values(rows, {y: "n"}, cm.stackY);
  assert.deepStrictEqual(y1, [0, 0, NaN, 2, -1, NaN]);
  assert.deepStrictEqual(y, [2, -1, NaN, 5, -3, NaN]);
});

test("cm.stackY orders the series by the domain of their hint", () => {
  const {y, y1} = values(data, {x: "state", y: "n", fill: {value: "age", domain: ["b", "a"]}}, cm.spreadX, cm.stackY);
  assert.deepStrictEqual(y1, [2, 0, 0]);
  assert.deepStrictEqual(y, [3, 2, 3]);
});

test("cm.stackY uses z for the series before fill", () => {
  const {y1} = values(
    data,
    {x: "state", y: "n", z: {value: "age", domain: ["b", "a"]}, fill: {value: "age", domain: ["a", "b"]}},
    cm.spreadX,
    cm.stackY,
  );
  assert.deepStrictEqual(y1, [2, 0, 0]);
});

test("cm.stackX sums x per y band, for stacked bars", () => {
  const {x, x1} = values(data, {y: "state", x: "n", fill: "age"}, cm.spreadY, cm.stackX);
  assert.deepStrictEqual(x1, [0, 1, 0]);
  assert.deepStrictEqual(x, [1, 3, 3]);
});

test("cm.stackX splits the x bands of cm.spreadX among the series, for grouped columns", () => {
  const {x, x1, y, y1} = values(data, {x: "state", y: "n", fill: "age"}, cm.spreadX, cm.stackX);
  const band = d3.scaleBand(["A", "B"], [0, 1]).padding(0.1);
  const w = band.bandwidth() / 2;
  // A series missing from a band keeps its slot: B has no "b", and its "a" takes the first half.
  assertAllInDelta(x, [band("A"), band("A") + w, band("B")]);
  assertAllInDelta(x1, [band("A") + w, band("A") + 2 * w, band("B") + w]);
  assert.deepStrictEqual(y, [1, 2, 3]);
  assert.deepStrictEqual(y1, [0, 0, 0]);
});

test("cm.stackY splits the y bands of cm.spreadY among the series, for grouped bars", () => {
  const {y, y1} = values(data, {y: "state", x: "n", fill: {value: "age", domain: ["b", "a"]}}, cm.spreadY, cm.stackY);
  const band = d3.scaleBand(["A", "B"], [0, 1]).padding(0.1);
  const w = band.bandwidth() / 2;
  assertAllInDelta(y, [band("A") + w, band("A"), band("B") + w]);
  assertAllInDelta(y1, [band("A") + 2 * w, band("A") + w, band("B") + 2 * w]);
});

test("cm.stackX and cm.stackY throw an error without channels", () => {
  assert.throws(() => cm.flow().data([1]).transform(cm.stackY), /No channels.*cm.stackY/);
  assert.throws(() => cm.flow().data([1]).transform(cm.stackX), /No channels.*cm.stackX/);
});
