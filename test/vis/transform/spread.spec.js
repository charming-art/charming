import assert from "node:assert";
import * as d3 from "d3";
import {test} from "vitest";
import "../../install-canvas-mock.js";
import * as cm from "../../../src/index.js";
import {assertInDelta, probe} from "../../helpers.js";

function contexts(data, channels, options, spread = cm.spreadX) {
  return cm.flow().data(data).transform(cm.encode, channels).transform(spread, options)._values;
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

test("cm.spreadX hints cm.plane to keep the outer padding of the bands", () => {
  const [shape, calls] = probe();
  const root = cm.flow().renderer(cm.canvas({width: 640, height: 400, dpi: 1}));
  root
    .data(data)
    .transform(cm.encode, {x: "letter", y: "frequency"})
    .transform(cm.spreadX)
    .transform(cm.plane, {margin: 0})
    .add(shape);
  root.render();
  const [{x}] = calls;
  const band = d3.scaleBand(["A", "B", "C"], [0, 640]).padding(0.1);
  assertAllInDelta(x, ["C", "A", "B"].map(band));
});

test("cm.spreadX orders the bands by the domain of the x hint", () => {
  const [{value, hints}] = contexts(data, {x: {value: "letter", domain: ["C", "A", "B"]}, y: "frequency"});
  const band = d3.scaleBand(["C", "A", "B"], [0, 1]).padding(0.1);
  assertAllInDelta(value.x, ["C", "A", "B"].map(band));
  assert.deepStrictEqual(hints.x, {
    label: "letter",
    domain: [0, 1],
    band: {domain: ["C", "A", "B"], paddingInner: 0.1, paddingOuter: 0.1, align: 0.5},
  });
});

test("cm.spreadY places each y in a band like d3.scaleBand with padding 0.1", () => {
  const [{value}] = contexts(data, {x: "frequency", y: "letter"}, undefined, cm.spreadY);
  const band = d3.scaleBand(["A", "B", "C"], [0, 1]).padding(0.1);
  assertAllInDelta(value.y, ["C", "A", "B"].map(band));
  assertAllInDelta(
    value.y1,
    ["C", "A", "B"].map((d) => band(d) + band.bandwidth()),
  );
});

test("cm.spreadY supports the padding, paddingInner, paddingOuter and align options", () => {
  const options = {paddingInner: 0.2, paddingOuter: 0.4, align: 0.25};
  const [{value}] = contexts(data, {x: "frequency", y: "letter"}, options, cm.spreadY);
  const band = d3.scaleBand(["A", "B", "C"], [0, 1]).paddingInner(0.2).paddingOuter(0.4).align(0.25);
  assertAllInDelta(value.y, ["C", "A", "B"].map(band));
});

test("cm.spreadY adds a zero baseline for numeric x, and keeps a bound x1", () => {
  const [{value}] = contexts(data, {x: "frequency", y: "letter"}, undefined, cm.spreadY);
  assert.deepStrictEqual(value.x1, [0, 0, 0]);
  const [{value: bound}] = contexts(data, {x: "frequency", x1: 1, y: "letter"}, undefined, cm.spreadY);
  assert.deepStrictEqual(bound.x1, [1, 1, 1]);
  const [{value: ordinal}] = contexts(data, {x: "letter", y: "letter"}, undefined, cm.spreadY);
  assert.strictEqual(ordinal.x1, undefined);
});

test("cm.spreadY orders the bands by the domain of the y hint, and hints its band", () => {
  const [{value, hints}] = contexts(
    data,
    {x: "frequency", y: {value: "letter", domain: ["C", "A", "B"]}},
    undefined,
    cm.spreadY,
  );
  const band = d3.scaleBand(["C", "A", "B"], [0, 1]).padding(0.1);
  assertAllInDelta(value.y, ["C", "A", "B"].map(band));
  assert.deepStrictEqual(hints.y, {
    label: "letter",
    domain: [0, 1],
    band: {domain: ["C", "A", "B"], paddingInner: 0.1, paddingOuter: 0.1, align: 0.5},
  });
});

test("cm.spreadX ignores repeated categories in the domain of the x hint, like d3.scaleBand", () => {
  const [{value, hints}] = contexts(data, {x: {value: "letter", domain: ["C", "C", "A", "B"]}, y: "frequency"});
  const band = d3.scaleBand(["C", "A", "B"], [0, 1]).padding(0.1);
  assertAllInDelta(value.x, ["C", "A", "B"].map(band));
  assert.deepStrictEqual(hints.x.band.domain, ["C", "A", "B"]);
});
