import assert from "node:assert";
import * as d3 from "d3";
import {test} from "vitest";
import "../../install-canvas-mock.js";
import * as cm from "../../../src/index.js";
import {assertInDelta, probe} from "../../helpers.js";

function contexts(data, channels, options) {
  return cm.flow().data(data).transform(cm.encode, channels).transform(cm.spreadX, options)._values;
}

function assertAllInDelta(actual, expected) {
  assert.strictEqual(actual.length, expected.length);
  actual.forEach((d, i) => assertInDelta(d, expected[i]));
}

const data = [
  {letter: "C", frequency: 3},
  {letter: "A", frequency: 1},
  {letter: "B", frequency: 2},
];

test("cm.spreadX places each x in a band like d3.scaleBand with padding 0.1", () => {
  const [{value}] = contexts(data, {x: "letter", y: "frequency"});
  const band = d3.scaleBand(["A", "B", "C"], [0, 1]).padding(0.1);
  assertAllInDelta(value.x, ["C", "A", "B"].map(band));
  assertAllInDelta(
    value.x1,
    ["C", "A", "B"].map((d) => band(d) + band.bandwidth()),
  );
});

test("cm.spreadX supports the padding, paddingInner, paddingOuter and align options", () => {
  const options = {paddingInner: 0.2, paddingOuter: 0.4, align: 0.25};
  const [{value}] = contexts(data, {x: "letter", y: "frequency"}, options);
  const band = d3.scaleBand(["A", "B", "C"], [0, 1]).paddingInner(0.2).paddingOuter(0.4).align(0.25);
  assertAllInDelta(value.x, ["C", "A", "B"].map(band));
  const [{value: zero}] = contexts(data, {x: "letter", y: "frequency"}, {padding: 0});
  assertAllInDelta(zero.x, [2 / 3, 0, 1 / 3]);
});

test("cm.spreadX adds a zero baseline for numeric y", () => {
  const [{value}] = contexts(data, {x: "letter", y: "frequency"});
  assert.deepStrictEqual(value.y1, [0, 0, 0]);
});

test("cm.spreadX keeps a bound y1", () => {
  const [{value}] = contexts(data, {x: "letter", y: "frequency", y1: 1});
  assert.deepStrictEqual(value.y1, [1, 1, 1]);
});

test("cm.spreadX does not add a baseline for non-numeric or missing y", () => {
  const [{value: ordinal}] = contexts(data, {x: "letter", y: "letter"});
  assert.strictEqual(ordinal.y1, undefined);
  const [{value: missing}] = contexts(data, {x: "letter"});
  assert.strictEqual(missing.y1, undefined);
});

test("cm.spreadX hints cm.fit to keep the outer padding, reverse y and leave margins", () => {
  const [shape, calls] = probe();
  const root = cm.flow().renderer(cm.canvas({width: 640, height: 400, dpi: 1}));
  root
    .data(data)
    .transform(cm.encode, {x: "letter", y: "frequency"})
    .transform(cm.spreadX)
    .transform(cm.fit)
    .add(shape);
  root.render();
  const [{x, y, y1}] = calls;
  const band = d3.scaleBand(["A", "B", "C"], [40, 620]).padding(0.1);
  assertAllInDelta(x, ["C", "A", "B"].map(band));
  assertAllInDelta(y, [20, 370 - 350 / 3, 370 - 700 / 3]);
  assert.deepStrictEqual(y1, [370, 370, 370]);
});
