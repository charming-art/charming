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

test("cm.stackY with chunk stacks equal values in rows of chunk, in data units", () => {
  const rows = Array.from({length: 5}, () => ({band: "A", n: 10}));
  const {y, y1, x, x1} = values(rows, {x: "band", y: "n"}, cm.spreadX, (flow, data) =>
    cm.stackY(flow, data, {chunk: 2, padding: 0}),
  );
  // Rows of 2 × 10 = 20 in data units: [0, 20], [0, 20], [20, 40], [20, 40], [40, 60].
  assert.deepStrictEqual(y1, [0, 0, 20, 20, 40]);
  assert.deepStrictEqual(y, [20, 20, 40, 40, 60]);
  // Columns are the two halves of the band of A.
  const band = d3.scaleBand(["A"], [0, 1]).padding(0.1);
  const w = band.bandwidth() / 2;
  assertAllInDelta(x, [band("A"), band("A") + w, band("A"), band("A") + w, band("A")]);
  assertAllInDelta(x1, [band("A") + w, band("A") + 2 * w, band("A") + w, band("A") + 2 * w, band("A") + w]);
});

test("cm.stackY with chunk stacks positive values up and negative values down, with gaps", () => {
  const rows = [10, -10, 10, -10, -10].map((n) => ({n}));
  const {y, y1} = values(rows, {y: "n"}, (flow, data) => cm.stackY(flow, data, {chunk: 2, padding: 0.5}));
  // Each row is 20 tall; padding 0.5 insets it by 5 on each side.
  assert.deepStrictEqual(y1, [5, -5, 5, -5, -25]);
  assert.deepStrictEqual(y, [15, -15, 15, -15, -35]);
});

test("cm.stackY with chunk keeps the other position if it has no band", () => {
  const rows = [
    {band: "A", n: 10},
    {band: "A", n: 10},
  ];
  const {x, x1, y} = values(rows, {x: "band", y: "n"}, (flow, data) => cm.stackY(flow, data, {chunk: 2, padding: 0}));
  assert.deepStrictEqual(x, ["A", "A"]);
  assert.strictEqual(x1, undefined);
  assert.deepStrictEqual(y, [20, 20]);
});

test("cm.stackY with chunk skips rows without a value", () => {
  const rows = [10, NaN, null, 10].map((n) => ({n}));
  const {y, y1} = values(rows, {y: "n"}, (flow, data) => cm.stackY(flow, data, {chunk: 2, padding: 0}));
  assert.deepStrictEqual(y1, [0, NaN, NaN, 0]);
  assert.deepStrictEqual(y, [20, NaN, NaN, 20]);
});

test("cm.stackY with chunk hints a domain from 0 that spans the rows with their gaps", () => {
  const stacked = (rows, options) =>
    cm
      .flow()
      .data(rows)
      .transform(cm.encode, {y: "n"})
      .transform((flow, data) => cm.stackY(flow, data, {chunk: 5, ...options}))._values[0].hints.y;
  assert.deepStrictEqual(stacked([10, 10, 10, 10, 10].map((n) => ({n}))).domain, [0, 50]);
  assert.deepStrictEqual(stacked([-10, -10, 10].map((n) => ({n}))).domain, [-50, 50]);
});

// Two x, three series: a = [1, 6], b = [3, 2], c = [2, 4].
const series = [
  {x: 0, k: "a", n: 1},
  {x: 0, k: "b", n: 3},
  {x: 0, k: "c", n: 2},
  {x: 1, k: "a", n: 6},
  {x: 1, k: "b", n: 2},
  {x: 1, k: "c", n: 4},
];

function ordered(options) {
  const {y, y1} = values(series, {x: "x", y: "n", fill: "k"}, (flow, data) => cm.stackY(flow, data, options));
  return {y, y1};
}

test("cm.stackY with order value sorts each stack by value, for ribbons", () => {
  // At x = 0: a, c, b; at x = 1: b, c, a.
  const {y1} = ordered({order: "value"});
  assert.deepStrictEqual(y1, [0, 3, 1, 6, 0, 2]);
});

test("cm.stackY with order sum orders the series by their totals", () => {
  // Totals: b = 5, c = 6, a = 7.
  const {y1} = ordered({order: "sum"});
  assert.deepStrictEqual(y1, [5, 0, 3, 6, 0, 2]);
});

test("cm.stackY with order appearance orders the series by the x of their maximum", () => {
  // Maxima: b at x = 0, a and c at x = 1, in order of appearance.
  const {y1} = ordered({order: "appearance"});
  assert.deepStrictEqual(y1, [3, 0, 4, 2, 0, 8]);
});

test("cm.stackY with order inside-out puts the earliest series in the middle", () => {
  const {y1} = ordered({order: "inside-out"});
  // Plot's order for this data: c, b, a.
  assert.deepStrictEqual(y1, [5, 2, 0, 6, 4, 0]);
});

test("cm.stackY takes an array of series as its order, and reverse", () => {
  assert.deepStrictEqual(ordered({order: ["c", "a", "b"]}).y1, [2, 3, 0, 4, 10, 0]);
  assert.deepStrictEqual(ordered({order: ["c", "a", "b"], reverse: true}).y1, [3, 0, 4, 2, 0, 8]);
  assert.deepStrictEqual(ordered({order: "-value"}).y1, ordered({order: "value", reverse: true}).y1);
});

test("cm.stackY keeps the input order without order", () => {
  assert.deepStrictEqual(ordered().y1, [0, 1, 4, 0, 6, 8]);
});

test("cm.stackY with order value sorts the rows around missing values", () => {
  const rows = [3, null, 1].map((n, i) => ({x: 0, k: `${i}`, n}));
  const {y1} = values(rows, {x: "x", y: "n", fill: "k"}, (flow, data) => cm.stackY(flow, data, {order: "value"}));
  assert.deepStrictEqual(y1, [1, NaN, 0]);
});

test("cm.stackY takes order names in any case, like Plot", () => {
  assert.deepStrictEqual(ordered({order: "Value"}).y1, ordered({order: "value"}).y1);
});

test("cm.stackY with offset normalize rescales each stack to [0, 1], like Plot", () => {
  const rows = [
    {x: 0, n: 1},
    {x: 0, n: 3},
    {x: 1, n: 2},
    {x: 1, n: 2},
  ];
  const {y, y1} = values(rows, {x: "x", y: "n"}, (flow, data) => cm.stackY(flow, data, {offset: "normalize"}));
  assert.deepStrictEqual(y1, [0, 0.25, 0, 0.5]);
  assert.deepStrictEqual(y, [0.25, 1, 0.5, 1]);
});

test("cm.stackY with offset normalize maps stacks with negative values to [0, 1] too", () => {
  const rows = [
    {x: 0, n: -1},
    {x: 0, n: 3},
  ];
  const {y, y1} = values(rows, {x: "x", y: "n"}, (flow, data) => cm.stackY(flow, data, {offset: "normalize"}));
  assert.deepStrictEqual(y1, [0.25, 0.25]);
  assert.deepStrictEqual(y, [0, 1]);
});

test("cm.stackY orders the series by a channel named by order, like Plot's field", () => {
  const rows = [
    {x: 0, k: "a", g: 2, n: 1},
    {x: 0, k: "b", g: 1, n: 1},
    {x: 0, k: "c", g: 3, n: 1},
  ];
  const by = (order, reverse) =>
    values(rows, {x: "x", y: "n", z: "k", g: "g"}, (flow, data) => cm.stackY(flow, data, {order, reverse})).y1;
  assert.deepStrictEqual(by("g"), [1, 0, 2]);
  assert.deepStrictEqual(by("g", true), [1, 2, 0]);
  assert.deepStrictEqual(by("-g"), [1, 2, 0]);
});

test("cm.stackY with offset normalize keeps a stack of zeros at 0, like Plot", () => {
  const rows = [
    {x: 0, n: 0},
    {x: 0, n: 0},
  ];
  const {y, y1} = values(rows, {x: "x", y: "n"}, (flow, data) => cm.stackY(flow, data, {offset: "normalize"}));
  assert.deepStrictEqual(y1, [0, 0]);
  assert.deepStrictEqual(y, [0, 0]);
});
