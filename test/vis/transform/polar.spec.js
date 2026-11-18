import assert from "node:assert";
import * as d3 from "d3";
import {test} from "vitest";
import "../../install-canvas-mock.js";
import * as cm from "../../../src/index.js";
import {widthOf} from "../../../src/vis/shape/axisUtils.js";
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
  assert.strictEqual(scales.x.type, "band");
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

test("cm.polar maps y to the radius with a radial scale by default, else with the type of its scale", () => {
  const {value, scales} = polared(letters, {x: "letter", y: "n"}, [cm.spreadX]);
  // A radial scale: radius 100 for 4 and sqrt(1 / 4) × 100 for 1, from 0 at the center.
  assertAllInDelta(value.y, [100, 50]);
  assertAllInDelta(value.y1, [0, 0]);
  assert.strictEqual(scales.y.type(1), 50);
  const named = polared(letters, {x: "letter", y: "n"}, [cm.spreadX], {y: {type: "radial"}});
  assertAllInDelta(named.value.y, [100, 50]);
  const linear = polared(letters, {x: "letter", y: "n"}, [cm.spreadX], {y: {type: "linear"}});
  assertAllInDelta(linear.value.y, [100, 25]);
});

test("cm.polar starts the radius at innerRadius, a fraction of the radius", () => {
  const {value, frame} = polared(letters, {x: "letter", y: "n"}, [cm.spreadX], {
    innerRadius: 0.5,
    y: {type: "linear"},
  });
  assertAllInDelta(value.y1, [50, 50]);
  assertAllInDelta(value.y, [100, 62.5]);
  assert.strictEqual(frame.innerRadius, 50);
});

test("cm.polar spans the whole radius without y, so that a pie needs no y", () => {
  const {value} = polared(letters, {x: "n"}, [cm.stackX], {innerRadius: 0.25});
  assert.deepStrictEqual(value.y, [100, 100]);
  assert.deepStrictEqual(value.y1, [25, 25]);
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
    left: 10,
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

test("cm.polar keeps the series of fill in z, and records a UTC time scale for dates", () => {
  const data = [new Date("2000-01-01"), new Date("2001-01-01")].map((date, i) => ({date, k: `${i}`}));
  const {value, scales} = polared(data, {x: "date", fill: "k"});
  assert.deepStrictEqual(value.z, ["0", "1"]);
  assert.strictEqual(scales.x.type, "utc");
});

test("cm.polar maps channels that share the radius, and records scales with apply", () => {
  const data = [
    {x: "A", y: 1, top: 4},
    {x: "B", y: 2, top: 3},
  ];
  const {value, scales} = polared(data, {x: "x", y: "y", top: {value: "top", scale: "y"}}, [cm.spreadX], {
    y: {type: "linear"},
  });
  assert.deepStrictEqual(scales.y.domain, [0, 4]);
  assertAllInDelta(value.top, [100, 75]);
  assert.strictEqual(scales.y.apply(2), 50);
});

test("cm.polar takes the options of a named scale of the radius", () => {
  const {scales} = polared(letters, {x: "letter", y: {value: "n", scale: "r"}}, [cm.spreadX], {
    r: {type: "linear"},
  });
  assert.strictEqual(scales.y.apply(2), 50);
});

test("cm.polar draws a nested chart in a width × height box around its parent point", () => {
  const renderer = cm.svg({width: 200, height: 100});
  const root = cm.flow().renderer(renderer);
  const [a, b] = root
    .data([
      {x: 0, y: 0, rows: [{n: 1}, {n: 3}]},
      {x: 1, y: 1, rows: [{n: 2}]},
    ])
    .transform(cm.encode, {x: "x", y: "y"})
    .transform(cm.plane)
    .append(cm.g)
    .data((d) => d.rows)
    .transform(cm.encode, {x: "n"})
    .transform(cm.stackX)
    .transform(cm.polar, {width: 40, height: 40, resolve: {x: "independent"}})._values;
  assert.deepStrictEqual([a.frame.cx, a.frame.cy, a.frame.outerRadius], [0, 0, 20]);
  // Each pie is a full turn.
  assertInDelta(Math.max(...a.value.x), 2 * Math.PI);
  assertInDelta(Math.max(...b.value.x), 2 * Math.PI);
});

test("cm.polar({clip: true}) clips marks to its disc, or its ring, around the center", () => {
  const disc = polared([1, 2], {x: (d) => d}, [], {clip: true});
  assert.strictEqual(disc.clip.x, 100);
  assert.strictEqual(disc.clip.y, 100);
  assert.strictEqual(disc.clip.d, d3.arc()({innerRadius: 0, outerRadius: 100, startAngle: 0, endAngle: 2 * Math.PI}));
  const ring = polared([1, 2], {x: (d) => d}, [], {clip: true, innerRadius: 0.5});
  assert.strictEqual(ring.clip.d, d3.arc()({innerRadius: 50, outerRadius: 100, startAngle: 0, endAngle: 2 * Math.PI}));
  assert.strictEqual(polared([1, 2], {x: (d) => d}).clipped, false);
});

test("cm.polar({clip: true}) clips marks, but not axes", () => {
  const renderer = cm.svg({width: 200, height: 200});
  cm.flow()
    .renderer(renderer)
    .data([1, 2, 3])
    .transform(cm.encode, {x: (d) => d, y: (d) => d})
    .transform(cm.polar, {clip: true})
    .add(cm.axis)
    .add(cm.circle, {r: 3})
    .add(cm.circle, {r: 300, clip: false})
    .render();
  const node = renderer.node();
  assert.strictEqual(node.querySelector("clipPath > path").getAttribute("transform"), "translate(100,100)");
  // A mark can opt out.
  const big = Array.from(node.querySelectorAll("circle")).filter((circle) => +circle.getAttribute("r") === 300);
  assert.strictEqual(big.length, 3);
  for (const circle of big) assert.ok(!circle.closest("[clip-path]"));
  for (const circle of node.querySelectorAll("circle")) {
    if (+circle.getAttribute("r") === 3) assert.ok(circle.closest("[clip-path]"));
  }
  for (const text of node.querySelectorAll("text")) assert.ok(!text.closest("[clip-path]"));
});

test("cm.polar takes the domain of the angle in scales", () => {
  const {value} = polared([{v: 1}, {v: 2}], {x: "v"}, [], {x: {domain: [0, 4]}});
  assertAllInDelta(value.x, [Math.PI / 2, Math.PI]);
});

test("cm.polar reverses the angle and the radius of reversed scales", () => {
  const forward = polared([{v: 1}, {v: 3}], {x: "v"}, [], {x: {domain: [0, 4]}});
  const reversed = polared([{v: 1}, {v: 3}], {x: "v"}, [], {x: {domain: [0, 4], reverse: true}});
  assertAllInDelta(forward.value.x, [Math.PI / 2, (3 * Math.PI) / 2]);
  assertAllInDelta(reversed.value.x, [(3 * Math.PI) / 2, Math.PI / 2]);
  const radius = polared([{v: 1}, {v: 2}], {x: () => 0, y: "v"}, [], {
    y: {type: "linear", domain: [0, 4], reverse: true},
  });
  assertAllInDelta(radius.value.y, [75, 50]);
  // A named radius is reversed too.
  const named = polared([{v: 1}, {v: 2}], {x: () => 0, y: {value: "v", scale: "r"}}, [], {
    r: {type: "linear", domain: [0, 4], reverse: true},
  });
  assertAllInDelta(named.value.y, [75, 50]);
});

// The frame of a polar chart of the given angles, with the options of cm.polar, and the boxes of its
// texts, measured like Plot's.
function polarLayout(options, labels = ["a", "b", "c", "d"], size = 400) {
  const renderer = cm.svg({width: size, height: size});
  const root = cm.flow().renderer(renderer);
  const [context] = root
    .data(labels.map((k) => ({k, v: 1})))
    .transform(cm.encode, {x: "k", y: "v"})
    .transform(cm.spreadX)
    .transform(cm.polar, options)._values;
  root.render();
  return [context.frame, Array.from(renderer.node().querySelectorAll("text"))];
}

test("cm.polar keeps its default margin of 40 without what's drawn past its disc", () => {
  const [frame] = polarLayout({});
  assert.deepStrictEqual([frame.cx, frame.cy, frame.outerRadius], [200, 200, 160]);
});

test("cm.polar grows its margins so that the tick labels of an outer angle axis fit, 3px from the edges", () => {
  const long = ["a long label", "another long label", "a third long label", "the last long label"];
  const [frame, texts] = polarLayout({x: {axis: "outer"}}, long);
  assert.ok(frame.outerRadius < 160);
  for (const t of texts) {
    const x = +t.getAttribute("x");
    const w = widthOf(t.textContent);
    const anchor = t.getAttribute("text-anchor") ?? "start";
    const x0 = anchor === "end" ? x - w : anchor === "middle" ? x - w / 2 : x;
    assert.ok(x0 >= 3 - 0.01 && x0 + w <= 400 - 3 + 0.01, t.textContent);
  }
  // The labels of an inner axis are in the hole, so the margins stay as they are.
  const [inner] = polarLayout({innerRadius: 0.5, x: {axis: "inner"}}, long);
  assert.strictEqual(inner.outerRadius, 160);
});

test("cm.polar keeps a given margin as it is", () => {
  const long = ["a long label", "another long label", "a third long label", "the last long label"];
  const [frame] = polarLayout({margin: 20, x: {axis: "outer"}}, long);
  assert.strictEqual(frame.outerRadius, 180);
  const [left] = polarLayout({marginLeft: 20, marginRight: 20, x: {axis: "outer"}}, long);
  assert.strictEqual(left.cx, 200);
});

test("cm.polar grows its right margin so that its legends on the right fit", () => {
  const renderer = cm.svg({width: 400, height: 400});
  const root = cm.flow().renderer(renderer);
  root
    .data([
      {k: "a category with a long name", v: 1},
      {k: "b", v: 2},
    ])
    .transform(cm.encode, {x: "v", fill: "k"})
    .transform(cm.stackX)
    .transform(cm.polar, {fill: {legend: "right"}})
    .add(cm.arc);
  root.render();
  const label = Array.from(renderer.node().querySelectorAll("text")).find((t) =>
    t.textContent.startsWith("a category"),
  );
  assert.strictEqual(label.textContent, "a category with a long name");
  assert.ok(+label.getAttribute("x") + widthOf(label.textContent) <= 400 - 3 + 1e-6);
});
