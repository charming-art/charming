import assert from "node:assert";
import * as d3 from "d3";
import {test} from "vitest";
import "../../install-canvas-mock.js";
import * as cm from "../../../src/index.js";
import {assertInDelta} from "../../helpers.js";

function contexts(data, channels, options) {
  return cm.flow().data(data).transform(cm.encode, channels).transform(cm.spreadY, options)._values;
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

test("cm.spreadY places each y in a band like d3.scaleBand with padding 0.1", () => {
  const [{value}] = contexts(data, {x: "frequency", y: "letter"});
  const band = d3.scaleBand(["A", "B", "C"], [0, 1]).padding(0.1);
  assertAllInDelta(value.y, ["C", "A", "B"].map(band));
  assertAllInDelta(
    value.y1,
    ["C", "A", "B"].map((d) => band(d) + band.bandwidth()),
  );
});

test("cm.spreadY supports the padding, paddingInner, paddingOuter and align options", () => {
  const options = {paddingInner: 0.2, paddingOuter: 0.4, align: 0.25};
  const [{value}] = contexts(data, {x: "frequency", y: "letter"}, options);
  const band = d3.scaleBand(["A", "B", "C"], [0, 1]).paddingInner(0.2).paddingOuter(0.4).align(0.25);
  assertAllInDelta(value.y, ["C", "A", "B"].map(band));
});

test("cm.spreadY adds a zero baseline for numeric x, and keeps a bound x1", () => {
  const [{value}] = contexts(data, {x: "frequency", y: "letter"});
  assert.deepStrictEqual(value.x1, [0, 0, 0]);
  const [{value: bound}] = contexts(data, {x: "frequency", x1: 1, y: "letter"});
  assert.deepStrictEqual(bound.x1, [1, 1, 1]);
  const [{value: ordinal}] = contexts(data, {x: "letter", y: "letter"});
  assert.strictEqual(ordinal.x1, undefined);
});

test("cm.spreadY orders the bands by the domain of the y hint, and hints its band", () => {
  const [{value, hints}] = contexts(data, {x: "frequency", y: {value: "letter", domain: ["C", "A", "B"]}});
  const band = d3.scaleBand(["C", "A", "B"], [0, 1]).padding(0.1);
  assertAllInDelta(value.y, ["C", "A", "B"].map(band));
  assert.deepStrictEqual(hints.y, {
    label: "letter",
    domain: [0, 1],
    band: {domain: ["C", "A", "B"], paddingInner: 0.1, paddingOuter: 0.1, align: 0.5},
  });
});
