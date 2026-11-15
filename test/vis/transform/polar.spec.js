import assert from "node:assert";
import * as d3 from "d3";
import {test} from "vitest";
import "../../install-canvas-mock.js";
import * as cm from "../../../src/index.js";
import {assertInDelta} from "../../helpers.js";

// A 200 × 200 renderer with a margin of 0: the center is (100, 100) and the radius is 100.
function polared(data, channels, transforms = [], options = {}, renderer = cm.svg({width: 200, height: 200})) {
  let flow = cm.flow().renderer(renderer).data(data).transform(cm.encode, channels);
  for (const transform of transforms) flow = flow.transform(transform);
  return flow.transform(cm.polar, {margin: 0, ...options})._values[0];
}

function assertAllInDelta(actual, expected) {
  assert.strictEqual(actual.length, expected.length);
  actual.forEach((d, i) => assertInDelta(d, expected[i]));
}

const letters = [
  {letter: "A", n: 4},
  {letter: "B", n: 1},
];

test("cm.polar turns the bands of cm.spreadX into angles, clockwise from 12 o'clock", () => {
  const {value, scales} = polared(letters, {x: "letter", y: "n"}, [cm.spreadX]);
  const band = d3
    .scaleBand(["A", "B"], [0, 2 * Math.PI])
    .padding(0.1)
    .align(0.5);
  assertAllInDelta(value.x, [band("A"), band("B")]);
  assertAllInDelta(value.x1, [band("A") + band.bandwidth(), band("B") + band.bandwidth()]);
  assert.strictEqual(scales.x.scale, "band");
  assert.deepStrictEqual(scales.x.domain, ["A", "B"]);
  assert.deepStrictEqual(scales.x.range, [0, 2 * Math.PI]);
});

test("cm.polar turns a stack along x into one full turn, for a pie", () => {
  const {value} = polared(letters, {x: "n"}, [cm.stackX]);
  assertAllInDelta(value.x1, [0, (4 / 5) * 2 * Math.PI]);
  assertAllInDelta(value.x, [(4 / 5) * 2 * Math.PI, 2 * Math.PI]);
});

test("cm.polar maps x to [startAngle, endAngle]", () => {
  const {value} = polared(letters, {x: "n"}, [cm.stackX], {startAngle: -Math.PI / 2, endAngle: Math.PI / 2});
  assertAllInDelta(value.x1, [-Math.PI / 2, (4 / 5) * Math.PI - Math.PI / 2]);
});

test("cm.polar maps y to the radius with a radial scale by default, else with scaleY", () => {
  const {value, scales} = polared(letters, {x: "letter", y: "n"}, [cm.spreadX]);
  // A radial scale: radius 100 for 4 and sqrt(1 / 4) × 100 for 1, from 0 at the center.
  assertAllInDelta(value.y, [100, 50]);
  assertAllInDelta(value.y1, [0, 0]);
  assert.strictEqual(scales.y.scale(1), 50);
  const named = polared(letters, {x: "letter", y: "n"}, [cm.spreadX], {scaleY: "radial"});
  assertAllInDelta(named.value.y, [100, 50]);
  const linear = polared(letters, {x: "letter", y: "n"}, [cm.spreadX], {scaleY: "linear"});
  assertAllInDelta(linear.value.y, [100, 25]);
});

test("cm.polar starts the radius at innerRadius, a fraction of the radius", () => {
  const {value, frame} = polared(letters, {x: "letter", y: "n"}, [cm.spreadX], {innerRadius: 0.5, scaleY: "linear"});
  assertAllInDelta(value.y1, [50, 50]);
  assertAllInDelta(value.y, [100, 62.5]);
  assert.strictEqual(frame.innerRadius, 50);
});

test("cm.polar spans the whole radius without y, so that a pie needs no y", () => {
  const {value} = polared(letters, {x: "n"}, [cm.stackX], {innerRadius: 0.25});
  assert.deepStrictEqual(value.y, [25, 25]);
  assert.deepStrictEqual(value.y1, [100, 100]);
});

test("cm.polar records the center in cx and cy, and its frame and scales", () => {
  const {value, frame, scales, hints} = polared(letters, {x: "letter", y: "n", fill: "letter"}, [cm.spreadX], {
    margin: 10,
  });
  assert.deepStrictEqual(value.cx, [100, 100]);
  assert.deepStrictEqual(value.cy, [100, 100]);
  assert.deepStrictEqual(frame, {
    type: "polar",
    cx: 100,
    cy: 100,
    innerRadius: 0,
    outerRadius: 90,
    startAngle: 0,
    endAngle: 2 * Math.PI,
  });
  assert.deepStrictEqual(value.fill, ["#5470c6", "#91cc75"]);
  assert.deepStrictEqual(scales.fill.domain, ["A", "B"]);
  assert.strictEqual(hints, undefined);
});

test("cm.polar sizes a renderer without a size to 640 by 640", () => {
  const renderer = cm.svg();
  const {frame} = polared(letters, {x: "n"}, [cm.stackX], {margin: undefined}, renderer);
  assert.deepStrictEqual([renderer._props.width, renderer._props.height], [640, 640]);
  assert.deepStrictEqual([frame.cx, frame.cy, frame.outerRadius], [320, 320, 280]);
});

test("cm.polar throws an error without channels or a renderer", () => {
  assert.throws(() => cm.polar(cm.flow(), undefined), /No channels/);
  assert.throws(() => cm.polar(cm.flow(), []), /No renderer/);
});
