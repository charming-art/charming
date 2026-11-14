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

const units = [
  {island: "B", species: "y"},
  {island: "A", species: "x"},
  {island: "A", species: "y"},
  {island: "A", species: "x"},
  {island: "B", species: "y"},
];

function spreads(data, channels, ...steps) {
  let flow = cm.flow().data(data).transform(cm.encode, channels);
  for (const [transform, options] of steps) flow = flow.transform(transform, options);
  return flow._values[0];
}

test("cm.spreadY with chunk groups the rows of each band, chunk at a time, in series order", () => {
  const {value, hints} = spreads(units, {x: "island", fill: "species"}, [cm.spreadX], [cm.spreadY, {chunk: 2}]);
  // The series order is y, x (first appearance). A has rows 2 (y), 1 (x), 3 (x) in chunks [2, 1]
  // and [3]; B has rows 0 and 4 in chunk [0, 4]; 2 chunks in all.
  const slot = d3.scaleBand([0, 1], [0, 1]).padding(0.1);
  assertAllInDelta(value.y, [0, 0, 0, 1, 0].map(slot));
  assertAllInDelta(
    value.y1,
    [0, 0, 0, 1, 0].map((s) => slot(s) + slot.bandwidth()),
  );
  assert.deepStrictEqual(hints.y, {domain: [0, 1], chunk: 2});
  assert.ok(hints.x.band);
});

test("cm.spreadX with chunk groups all rows when no band exists", () => {
  const {value} = spreads(units, {fill: "species"}, [cm.spreadX, {chunk: 3, padding: 0}]);
  // Series order y, y, y, x, x by first appearance: chunks [y, y, y], [x, x].
  assert.deepStrictEqual(value.x, [0, 0.5, 0, 0.5, 0]);
});

test("cm.spreadX spread again subdivides the band of each row into slots, in series order", () => {
  const {value, hints} = spreads(
    units,
    {x: "island", fill: "species"},
    [cm.spreadX],
    [cm.spreadY, {chunk: 2}],
    [cm.spreadX, {padding: 0}],
  );
  const band = d3.scaleBand(["A", "B"], [0, 1]).padding(0.1);
  const w = band.bandwidth() / 2;
  // In A, chunk [2 (y), 1 (x)] fills both slots and chunk [3] the first; in B, chunk [0, 4] fills both.
  assertAllInDelta(value.x, [band("B"), band("A") + w, band("A"), band("A"), band("B") + w]);
  assertAllInDelta(value.x1, [band("B") + w, band("A") + 2 * w, band("A") + w, band("A") + w, band("B") + 2 * w]);
  assert.deepStrictEqual(hints.x.band.domain, ["A", "B"]);
});

test("cm.spreadX chunk rows grow up from the bottom of the chart in cm.plane", () => {
  const root = cm.flow().renderer(cm.svg({width: 200, height: 100}));
  const [context] = root
    .data(units)
    .transform(cm.encode, {x: "island", fill: "species"})
    .transform(cm.spreadX)
    .transform(cm.spreadY, {chunk: 2})
    .transform(cm.plane, {margin: 0})._values;
  // Row 1 is in the first chunk of A and row 3 in the second: the first chunk is at the bottom.
  assert.ok(context.value.y[1] > context.value.y[3]);
});
