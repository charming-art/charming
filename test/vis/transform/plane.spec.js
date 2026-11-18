import assert from "node:assert";
import * as d3 from "d3";
import {test} from "vitest";
import "../../install-canvas-mock.js";
import * as cm from "../../../src/index.js";
import {widthOf} from "../../../src/vis/shape/axisUtils.js";
import {assertInDelta, probe} from "../../helpers.js";

function values(data, channels, options) {
  const [shape, calls] = probe();
  const root = cm.flow().renderer(cm.canvas({width: 640, height: 400, dpi: 1}));
  root.data(data).transform(cm.bind, channels).transform(cm.plane, options).add(shape);
  root.render();
  return calls[0];
}

test("cm.plane maps x and y with y up and the default margins of a chart", () => {
  const {x, y} = values([0, 1], {x: (d) => d, y: (d) => d});
  // The margins fit what the axes draw, without titles: left of y, the tick 6, the padding 3 and the
  // widest tick label, "0.4", and 3px; under x, the same 9, a label 10 and 3px. Over y, half a
  // label and 3px, and right of x, half its last label and 3px, are under the floors, 10 and 20.
  const left = 3 + 6 + 3 + widthOf("0.4");
  assertInDelta(x[0], left);
  assert.strictEqual(x[1], 620);
  assert.deepStrictEqual(y, [400 - 3 - 6 - 3 - 10, 10]);
});

test("cm.plane uses margin as the default of each side", () => {
  const {x, y} = values([0, 1], {x: (d) => d, y: (d) => d}, {margin: 10, marginLeft: 50});
  assert.deepStrictEqual(x, [50, 630]);
  assert.deepStrictEqual(y, [390, 10]);
});

test("cm.plane takes the domain and the direction of positions in scales", () => {
  const {x, y} = values([0, 1], {x: (d) => d, y: (d) => d}, {x: {domain: [0, 2]}, y: {reverse: false}});
  const left = 3 + 6 + 3 + widthOf("0.4");
  assertInDelta(x[0], left);
  assertInDelta(x[1], (left + 620) / 2);
  assert.deepStrictEqual(y, [10, 378]);
});

test("cm.plane places the bands of cm.spreadX like a band scale in the chart area", () => {
  const [shape, calls] = probe();
  const root = cm.flow().renderer(cm.canvas({width: 640, height: 400, dpi: 1}));
  const flow = root
    .data([
      {letter: "B", frequency: 2},
      {letter: "A", frequency: 1},
    ])
    .transform(cm.encode, {x: "letter", y: "frequency"})
    .transform(cm.spreadX)
    .transform(cm.plane);
  const [{frame}] = flow._values;
  flow.add(shape);
  root.render();
  const [{x, y, y1}] = calls;
  // The titles take a top margin of 24, for y's level over the axis, and a bottom one of 38, for the
  // tick labels and the title of x, and 3px.
  assert.deepStrictEqual([frame.top, 400 - frame.bottom], [24, 3 + 6 + 3 + 10 + 6 + 10]);
  const band = d3.scaleBand(["A", "B"], [frame.left, 620]).padding(0.1);
  ["B", "A"].forEach((d, i) => assertInDelta(x[i], band(d)));
  assert.deepStrictEqual(y, [24, (24 + frame.bottom) / 2]);
  assert.deepStrictEqual(y1, [frame.bottom, frame.bottom]);
});

function encoded(data, channels, options) {
  const [shape, calls] = probe();
  const root = cm.flow().renderer(cm.canvas({width: 640, height: 400, dpi: 1}));
  root.data(data).transform(cm.encode, channels).transform(cm.plane, options).add(shape);
  root.render();
  return calls[0];
}

const genres = [
  {genre: "Sports", sold: 275},
  {genre: "Strategy", sold: 115},
  {genre: "Action", sold: 120},
];

test("cm.plane colors categorical fill and stroke with the default scheme, in sorted order", () => {
  const {fill, stroke} = encoded(genres, {x: "genre", y: "sold", fill: "genre", stroke: "genre"});
  assert.deepStrictEqual(fill, ["#91cc75", "#fac858", "#5470c6"]);
  assert.deepStrictEqual(stroke, fill);
});

test("cm.plane takes the type, domain and range of colors in scales", () => {
  const {fill} = encoded(
    genres,
    {x: "genre", y: "sold", fill: "genre"},
    {fill: {domain: ["Strategy", "Sports", "Action"], range: ["red", "green", "blue"]}},
  );
  assert.deepStrictEqual(fill, ["green", "red", "blue"]);
  const {fill: ordinal} = encoded(genres, {x: "genre", y: "sold", fill: "sold"}, {fill: {type: "ordinal"}});
  assert.deepStrictEqual(ordinal, ["#fac858", "#5470c6", "#91cc75"]);
});

test("cm.plane leaves constant colors unchanged, and maps numeric colors with turbo, like Plot", () => {
  const {fill, stroke} = encoded(genres, {x: "genre", y: "sold", fill: "red", stroke: "sold"});
  assert.deepStrictEqual(fill, ["red", "red", "red"]);
  assert.deepStrictEqual(stroke, [d3.interpolateTurbo(1), d3.interpolateTurbo(0), d3.interpolateTurbo(5 / 160)]);
});

test("cm.plane maps linear colors with the interpolator of a scheme, case-insensitive", () => {
  const {fill} = encoded(genres, {x: "genre", y: "sold", fill: "sold"}, {fill: {type: "linear", scheme: "piyg"}});
  assert.deepStrictEqual(fill, [d3.interpolatePiYG(1), d3.interpolatePiYG(0), d3.interpolatePiYG(5 / 160)]);
});

test("cm.plane maps linear colors through the colors of a range", () => {
  const {fill} = encoded(genres, {x: "genre", fill: "sold"}, {fill: {type: "linear", range: ["white", "red"]}});
  assert.deepStrictEqual(fill, ["rgb(255, 0, 0)", "rgb(255, 255, 255)", "rgb(255, 247, 247)"]);
});

test("cm.plane gives missing numeric colors no color", () => {
  const data = [
    {k: "a", v: 1},
    {k: "b", v: null},
    {k: "c", v: 3},
  ];
  const {fill} = encoded(data, {x: "k", fill: "v"});
  assert.deepStrictEqual(fill, [d3.interpolateTurbo(0), undefined, d3.interpolateTurbo(1)]);
});

test("cm.plane records the resolved scales and drops the hints", () => {
  const root = cm.flow().renderer(cm.canvas({width: 640, height: 400, dpi: 1}));
  const [context] = root
    .data(genres)
    .transform(cm.encode, {x: "genre", y: "sold", fill: "genre"})
    .transform(cm.spreadX)
    .transform(cm.plane)._values;
  assert.strictEqual(context.hints, undefined);
  assert.deepStrictEqual(Object.keys(context.scales).sort(), ["fill", "x", "x1", "y", "y1"]);
  assert.deepStrictEqual(context.scales.fill.domain, ["Action", "Sports", "Strategy"]);
  assert.deepStrictEqual(context.scales.fill.label, "genre");
  assert.deepStrictEqual(context.scales.x, {
    type: "band",
    domain: ["Action", "Sports", "Strategy"],
    paddingInner: 0.1,
    paddingOuter: 0.1,
    align: 0.5,
    range: [context.frame.left, 620],
    label: "genre",
  });
  assert.deepStrictEqual(context.scales.y, {type: "linear", domain: [0, 275], range: [362, 24], label: "sold"});
});

test("cm.plane uses the domain and type hinted for x and y, and the options of scales override them", () => {
  const root = cm.flow().renderer(cm.canvas({width: 640, height: 400, dpi: 1}));
  const flow = root
    .data([0, 1])
    .transform(cm.bind, {x: (d) => d, y: (d) => d})
    .transform((_, data) => data.map((d) => ({...d, hints: {x: {domain: [0, 2]}, y: {type: "ordinal"}}})));
  const [hinted] = flow.transform(cm.plane, {margin: 0})._values;
  assert.deepStrictEqual(hinted.value.x, [0, 320]);
  assert.deepStrictEqual(hinted.value.y, [400, 0]);
  const [explicit] = flow.transform(cm.plane, {margin: 0, x: {domain: [0, 1]}})._values;
  assert.deepStrictEqual(explicit.value.x, [0, 640]);
});

test("cm.plane records x and x1 with one shared scale", () => {
  const root = cm.flow().renderer(cm.canvas({width: 640, height: 400, dpi: 1}));
  const [context] = root
    .data([0, 1])
    .transform(cm.bind, {x: (d) => d, x1: (d) => d + 1, y: (d) => d})
    .transform(cm.plane, {margin: 0})._values;
  assert.deepStrictEqual(context.scales.x, {type: "linear", domain: [0, 2], range: [0, 640]});
  assert.deepStrictEqual(context.scales.x1, context.scales.x);
  assert.deepStrictEqual(context.value.x1, [320, 640]);
});

test("cm.plane records a copied d3 scale with its resolved domain and range", () => {
  const sqrt = d3.scaleSqrt();
  const root = cm.flow().renderer(cm.canvas({width: 640, height: 400, dpi: 1}));
  const [context] = root
    .data([0, 4])
    .transform(cm.bind, {x: (d) => d, y: (d) => d})
    .transform(cm.plane, {margin: 0, y: {type: sqrt}})._values;
  const {type, domain, range} = context.scales.y;
  assert.notStrictEqual(type, sqrt);
  assert.deepStrictEqual(type.domain(), [0, 4]);
  assert.deepStrictEqual(domain, [0, 4]);
  assert.deepStrictEqual(range, [400, 0]);
});

test("cm.plane keeps colors that are already colors, like an identity scale", () => {
  const data = [
    {genre: "Sports", color: "steelblue"},
    {genre: "Action", color: "orange"},
  ];
  const {fill} = encoded(data, {x: "genre", y: 1, fill: "color"});
  assert.deepStrictEqual(fill, ["steelblue", "orange"]);
  const {stroke} = encoded(data, {x: "genre", y: 1, stroke: (d) => ({ch: "#", fg: d.color})});
  assert.deepStrictEqual(stroke, [
    {ch: "#", fg: "steelblue"},
    {ch: "#", fg: "orange"},
  ]);
});

test("cm.plane colors equal dates with the same color", () => {
  const data = [
    {x: "a", date: new Date(2020, 0, 1)},
    {x: "b", date: new Date(2020, 0, 1)},
  ];
  const {fill} = encoded(data, {x: "x", y: 1, fill: "date"}, {fill: {type: "ordinal"}});
  assert.deepStrictEqual(fill, ["#5470c6", "#5470c6"]);
});

test("cm.plane records categorical positions as a point scale", () => {
  const root = cm.flow().renderer(cm.canvas({width: 640, height: 400, dpi: 1}));
  const [context] = root
    .data(["a", "b", "c"])
    .transform(cm.bind, {x: (d) => d, y: 0})
    .transform(cm.plane, {margin: 0, x: {type: "ordinal"}})._values;
  assert.deepStrictEqual(context.value.x, [0, 320, 640]);
  assert.strictEqual(context.scales.x.type, "point");
});

test("cm.plane applies the options of the scale of x to x1, which shares it", () => {
  const root = cm.flow().renderer(cm.canvas({width: 640, height: 400, dpi: 1}));
  const [context] = root
    .data([1, 2])
    .transform(cm.encode, {x: 0, x1: (d) => d, y: 0})
    .transform(cm.plane, {margin: 0, x: {domain: [0, 10]}})._values;
  assert.deepStrictEqual(context.value.x1, [64, 128]);
  assert.deepStrictEqual(context.scales.x.domain, [0, 10]);
});

function planed(renderer, data, channels, options) {
  const root = cm.flow().renderer(renderer);
  return root.data(data).transform(cm.encode, channels).transform(cm.plane, options)._values[0];
}

test("cm.plane sizes a renderer without a size like Plot: 640 by 68 without y, with x in the middle", () => {
  const renderer = cm.svg();
  const context = planed(renderer, [{v: 1}, {v: 2}, {v: 3}], {x: "v"});
  // A frame of 30px, like Plot's, and a bottom margin of 38 for the tick labels and title of x.
  assert.deepStrictEqual([renderer._props.width, renderer._props.height], [640, 68]);
  assert.deepStrictEqual(context.frame, {top: 0, right: 620, bottom: 30, left: 20});
  assert.deepStrictEqual(context.value.x, [20, 320, 620]);
  assert.deepStrictEqual(context.value.y, [15, 15, 15]);
});

test("cm.plane sizes a renderer without a size like Plot: 640 by 400 with a continuous y", () => {
  const renderer = cm.canvas({dpi: 1});
  planed(renderer, [1, 2, 3], {x: (d) => d, y: (d) => d});
  assert.deepStrictEqual([renderer._props.width, renderer._props.height], [640, 400]);
});

test("cm.plane sizes a renderer without a size like Plot: 20px per category of y", () => {
  const renderer = cm.svg();
  planed(renderer, ["a", "b", "c"], {x: 1, y: (d) => d});
  // A frame of 20px per category plus 10, with the margins of untitled axes: the floor of 10 over y,
  // and 22 under x, for its tick labels.
  assert.strictEqual(renderer._props.height, 3 * 20 + 10 + 10 + 22);
});

test("cm.plane keeps the given size of a renderer, and resizes it for its width and height options", () => {
  const renderer = cm.svg({width: 300, height: 200});
  planed(renderer, [1, 2], {x: (d) => d});
  assert.deepStrictEqual([renderer._props.width, renderer._props.height], [300, 200]);
  planed(renderer, [1, 2], {x: (d) => d}, {width: 500, height: 100});
  assert.deepStrictEqual([renderer._props.width, renderer._props.height], [500, 100]);
});

test("cm.plane centers x when only y is encoded, and explicit margins win", () => {
  const renderer = cm.svg({width: 200, height: 100});
  const context = planed(renderer, [1, 2], {y: (d) => d}, {margin: 10});
  assert.deepStrictEqual(context.frame, {top: 10, right: 190, bottom: 90, left: 10});
  assert.deepStrictEqual(context.value.x, [100, 100]);
  assert.deepStrictEqual(context.value.y, [90, 10]);
});

test("cm.plane centers y for a typed array x", () => {
  const renderer = cm.svg();
  const root = cm.flow().renderer(renderer);
  const [context] = root
    .data([1, 2])
    .transform(cm.bind, {x: (d) => d})
    .transform((_, data) => data.map((d) => ({...d, value: {x: new Float64Array([1, 2])}})))
    .transform(cm.plane)._values;
  assert.deepStrictEqual(context.value.y, [15, 15]);
});

test("cm.plane sizes the chart with the type and domain of the scale of y", () => {
  const ordinal = cm.svg();
  planed(ordinal, [1, 2], {x: (d) => d, y: (d) => d}, {y: {type: "ordinal"}});
  assert.strictEqual(ordinal._props.height, 2 * 20 + 10 + 10 + 22);
  const domain = cm.svg();
  planed(domain, ["a", "b"], {x: 1, y: (d) => d}, {y: {domain: ["a", "b", "c", "d"]}});
  assert.strictEqual(domain._props.height, 4 * 20 + 10 + 10 + 22);
});

test("cm.plane places the bands of cm.spreadY from the top, unless the scale of y is reversed", () => {
  const data = [
    {letter: "B", frequency: 2},
    {letter: "A", frequency: 1},
  ];
  const root = cm.flow().renderer(cm.svg({width: 640, height: 400}));
  const flow = root.data(data).transform(cm.encode, {x: "frequency", y: "letter"}).transform(cm.spreadY);
  const [context] = flow.transform(cm.plane)._values;
  // Like Plot's, the title of a discrete y is turned at its middle, leaving the top to half a label.
  const band = d3.scaleBand(["A", "B"], [10, 362]).padding(0.1);
  ["B", "A"].forEach((d, i) => assertInDelta(context.value.y[i], band(d)));
  assert.deepStrictEqual(context.scales.y.type, "band");
  assert.deepStrictEqual(context.scales.y.domain, ["A", "B"]);
  assert.deepStrictEqual(context.scales.y.range, [10, 362]);
  const [reversed] = flow.transform(cm.plane, {y: {reverse: true}})._values;
  assert.ok(reversed.value.y[1] > reversed.value.y[0]);
});

test("cm.plane keeps the series of fill in z, before its colors are scaled", () => {
  const root = cm.flow().renderer(cm.svg({width: 200, height: 200}));
  const [context] = root
    .data(["a", "b"])
    .transform(cm.encode, {x: (d, i) => i, fill: (d) => d})
    .transform(cm.plane)._values;
  assert.deepStrictEqual(context.value.z, ["a", "b"]);
  assert.deepStrictEqual(context.value.fill, ["#5470c6", "#91cc75"]);
});

test("cm.plane records a UTC time scale for dates", () => {
  const root = cm.flow().renderer(cm.svg({width: 200, height: 200}));
  const dates = [new Date("2000-01-01"), new Date("2001-01-01")];
  const [context] = root
    .data(dates)
    .transform(cm.encode, {x: (d) => d})
    .transform(cm.plane)._values;
  assert.strictEqual(context.scales.x.type, "utc");
  assert.deepStrictEqual(context.value.x, [20, 180]);
});

test("cm.plane maps channels that share a scale, and widens its domain with them", () => {
  const root = cm.flow().renderer(cm.svg({width: 200, height: 200}));
  const data = [
    {x: 0, low: 1, high: 2, v2: 4},
    {x: 1, low: 0, high: 3, v2: 3},
  ];
  const [context] = root
    .data(data)
    .transform(cm.encode, {x: "x", y: "high", y1: "low", v2: {value: "v2", scale: "y"}})
    .transform(cm.plane, {margin: 0})._values;
  assert.deepStrictEqual(context.scales.y.domain, [0, 4]);
  assert.deepStrictEqual(context.value.y, [100, 50]);
  assert.deepStrictEqual(context.value.v2, [0, 50]);
  // The label of the axis is still the one of y.
  assert.strictEqual(context.scales.y.label, "high");
  assert.strictEqual(context.scales.v2, context.scales.y);
});

test("cm.plane records scales with apply and invert, at the middle of bands", () => {
  const root = cm.flow().renderer(cm.svg({width: 200, height: 200}));
  const [context] = root
    .data([
      {letter: "A", n: 0},
      {letter: "B", n: 4},
    ])
    .transform(cm.encode, {x: "letter", y: "n"})
    .transform(cm.spreadX)
    .transform(cm.plane, {margin: 0})._values;
  const band = d3.scaleBand(["A", "B"], [0, 200]).padding(0.1);
  assertInDelta(context.scales.x.apply("B"), band("B") + band.bandwidth() / 2);
  assert.strictEqual(context.scales.y.apply(2), 100);
  assert.strictEqual(context.scales.y.invert(100), 2);
  // apply and invert aren't enumerable, so that records stay plain.
  assert.deepStrictEqual(Object.keys(context.scales.y), ["type", "domain", "range", "label"]);
});

test("cm.plane makes a y scale from channels that share it, even without y", () => {
  const renderer = cm.svg();
  const root = cm.flow().renderer(renderer);
  const [context] = root
    .data([
      {x: 0, v2: 1},
      {x: 1, v2: 4},
    ])
    .transform(cm.encode, {x: "x", v2: {value: "v2", scale: "y"}})
    .transform(cm.plane)._values;
  assert.deepStrictEqual(context.scales.y.domain, [1, 4]);
  assert.strictEqual(context.scales.v2, context.scales.y);
  // Sized like a chart with a continuous y, not a dot plot.
  assert.strictEqual(renderer._props.height, 400);
  assert.strictEqual(context.frame.top, 10);
});

// A chart of two columns, A and B, each with a nested chart of its own rows.
function facets(rows, channels, options) {
  const renderer = cm.svg({width: 200, height: 100});
  const root = cm.flow().renderer(renderer);
  const contexts = root
    .data(rows)
    .transform(cm.encode, {x: ([key]) => key})
    .transform(cm.spreadX, {padding: 0})
    .transform(cm.plane, {margin: 0})
    .append(cm.g)
    .data(([, values]) => values)
    .transform(cm.encode, channels)
    .transform(cm.plane, options)._values;
  return [renderer, contexts];
}

const columns = [
  [
    "A",
    [
      {v: 1, k: "p"},
      {v: 2, k: "p"},
    ],
  ],
  [
    "B",
    [
      {v: 3, k: "q"},
      {v: 4, k: "p"},
    ],
  ],
];

test("cm.plane draws a nested chart in the band of its parent row, without margins or resizing", () => {
  const [renderer, [a, b]] = facets(columns, {y: "v"});
  assert.deepStrictEqual([renderer._props.width, renderer._props.height], [200, 100]);
  assert.deepStrictEqual([a.frame.left, a.frame.right, a.frame.top, a.frame.bottom], [0, 100, -50, 50]);
  assert.deepStrictEqual([b.frame.left, b.frame.right], [0, 100]);
});

test("cm.plane shares the scales of nested charts, and their colors", () => {
  const [, [a, b]] = facets(columns, {y: "v", fill: "k"});
  assert.deepStrictEqual(a.scales.y.domain, [1, 4]);
  assert.deepStrictEqual(b.scales.y.domain, [1, 4]);
  assert.deepStrictEqual(a.scales.fill.domain, ["p", "q"]);
  assert.deepStrictEqual(b.value.fill, ["#91cc75", "#5470c6"]);
});

test("cm.plane infers a position per nested chart with resolve independent", () => {
  const [, [a, b]] = facets(columns, {y: "v"}, {resolve: {y: "independent"}});
  assert.deepStrictEqual(a.scales.y.domain, [1, 2]);
  assert.deepStrictEqual(b.scales.y.domain, [3, 4]);
});

test("cm.plane combines the hinted domains of nested charts", () => {
  const rows = [
    ["A", [1, 1, 1]],
    ["B", [1]],
  ];
  const renderer = cm.svg({width: 200, height: 100});
  const root = cm.flow().renderer(renderer);
  const [c, d] = root
    .data(rows)
    .transform(cm.encode, {x: ([key]) => key})
    .transform(cm.spreadX)
    .transform(cm.plane)
    .append(cm.g)
    .data(([, values]) => values)
    .transform(cm.encode, {y: (d) => d})
    .transform(cm.stackY, {chunk: 1, padding: 0})
    .transform(cm.plane)._values;
  assert.deepStrictEqual(c.scales.y.domain, [0, 3]);
  assert.deepStrictEqual(d.scales.y.domain, [0, 3]);
});

test("cm.plane draws a nested chart at a point in a width × height box", () => {
  const renderer = cm.svg({width: 200, height: 100});
  const root = cm.flow().renderer(renderer);
  const [context] = root
    .data([{x: 1, y: 1, rows: [{v: 1}, {v: 2}]}])
    .transform(cm.encode, {x: "x", y: "y"})
    .transform(cm.plane)
    .append(cm.g)
    .data((d) => d.rows)
    .transform(cm.encode, {y: "v"})
    .transform(cm.plane, {width: 40, height: 20})._values;
  const {left, right, top, bottom} = context.frame;
  assert.deepStrictEqual([left, right, top, bottom], [-20, 20, -10, 10]);
});

test("cm.plane maps large data", () => {
  const root = cm.flow().renderer(cm.svg({width: 640, height: 400}));
  const n = 300000;
  const [context] = root
    .data(Array.from({length: n}, (_, i) => i))
    .transform(cm.encode, {x: (d) => d})
    .transform(cm.plane)._values;
  assert.strictEqual(context.value.x.length, n);
});

// Two nested charts of y, with a hint for each, such as the extents of a transform per context.
function hinted(hints) {
  const root = cm.flow().renderer(cm.svg({width: 200, height: 100}));
  return root
    .data([
      ["A", [{v: 2}]],
      ["B", [{v: 2}]],
    ])
    .transform(cm.encode, {x: ([key]) => key})
    .transform(cm.spreadX)
    .transform(cm.plane)
    .append(cm.g)
    .data(([, values]) => values)
    .transform(cm.encode, {y: "v"})
    .transform((flow, data) => data.map((d, j) => ({...d, hints: {...d.hints, y: {...d.hints.y, ...hints[j]}}})))
    .transform(cm.plane)._values;
}

test("cm.plane shares the extent of reversed hinted domains, reversed", () => {
  const [a, b] = hinted([{domain: [10, 0]}, {domain: [4, 1]}]);
  assert.deepStrictEqual(a.scales.y.domain, [10, 0]);
  assert.deepStrictEqual(b.scales.y.domain, [10, 0]);
});

test("cm.plane shares the union of hinted category domains, even of two numbers", () => {
  const [a] = hinted([
    {type: "ordinal", domain: [1, 2]},
    {type: "ordinal", domain: [2, 3]},
  ]);
  assert.deepStrictEqual(a.scales.y.domain, [1, 2, 3]);
  assert.ok(Number.isFinite(a.value.y[0]));
});

// Plans two branches of x and y together, with options for cm.plane, and returns their scales.
function branchScales(options) {
  const root = cm.flow().renderer(cm.svg({width: 100, height: 100}));
  const [a, b] = root
    .branch(
      (flow) =>
        flow
          .data([
            {x: 0, y: 0},
            {x: 5, y: 10},
          ])
          .transform(cm.encode, {x: "x", y: "y"}),
      (flow) => flow.data([{x: 10, y: 1}]).transform(cm.encode, {x: "x", y: "y"}),
    )
    .transform(cm.plane, options);
  return [a, b].map((flow) => flow._values[0].scales);
}

test("cm.plane shares the scales of branches, drawn in the same frame", () => {
  const [a, b] = branchScales();
  assert.deepStrictEqual(a.x.domain, [0, 10]);
  assert.deepStrictEqual(b.x.domain, [0, 10]);
  assert.deepStrictEqual(a.y.domain, [0, 10]);
  assert.deepStrictEqual(b.y.domain, [0, 10]);
});

test("cm.plane resolves y per branch with resolve independent, and shares x, for dual axes", () => {
  const [a, b] = branchScales({resolve: {y: "independent"}});
  assert.deepStrictEqual(a.x.domain, [0, 10]);
  assert.deepStrictEqual(b.x.domain, [0, 10]);
  assert.deepStrictEqual(a.y.domain, [0, 10]);
  assert.deepStrictEqual(b.y.domain, [1, 1]);
  assert.deepStrictEqual(a.y.range, b.y.range);
});

test("cm.plane draws the branches of a nested flow in the cells of their parent rows", () => {
  const root = cm.flow().renderer(cm.svg({width: 100, height: 100}));
  const [a, b] = root
    .data([
      {k: "p", n: 1},
      {k: "q", n: 4},
    ])
    .transform(cm.encode, {x: "k", n: "n"})
    .transform(cm.spreadX, {flex: "n", padding: 0})
    .transform(cm.plane, {margin: 0})
    .append(cm.g)
    .data(() => [{v: 1}, {v: 2}])
    .branch(
      (flow) => flow.transform(cm.encode, {x: "v", y: "v"}),
      (flow) => flow.transform(cm.encode, {x: "v", y: "v"}),
    )
    .transform(cm.plane);
  const frames = (flow) => flow._values.map(({frame: {left, right}}) => [left, right]);
  // Each cell is drawn at its band, so its frame spans the band's width, 20 and 80, from 0.
  assert.deepStrictEqual(frames(a), [
    [0, 20],
    [0, 80],
  ]);
  assert.deepStrictEqual(frames(b), frames(a));
});

test("cm.plane points each independent y its own way, and leaves room for the positions of any branch", () => {
  const plane = (first, second) => {
    const root = cm.flow().renderer(cm.svg({width: 100, height: 100}));
    return [
      ...root
        .branch(
          (flow) => first(flow.data([{c: "a", v: 1}])),
          (flow) => second(flow.data([{c: "a", v: 1}])),
        )
        .transform(cm.plane, {resolve: {y: "independent"}}),
    ].map((flow) => flow._values[0]);
  };
  const bands = (flow) => flow.transform(cm.encode, {y: "c"}).transform(cm.spreadY);
  const values = (flow) => flow.transform(cm.encode, {y: "v"});
  // A band y goes down from the top, and a linear y up from the bottom, in either order.
  const [band, linear] = plane(bands, values);
  assert.ok(band.scales.y.range[0] < band.scales.y.range[1]);
  assert.ok(linear.scales.y.range[0] > linear.scales.y.range[1]);
  const [linear2, band2] = plane(values, bands);
  assert.deepStrictEqual(linear2.scales.y.range, linear.scales.y.range);
  assert.deepStrictEqual(band2.scales.y.range, band.scales.y.range);
  // Only the second branch has y, and the chart still has the margins of a y axis.
  const [, only] = plane((flow) => flow.transform(cm.encode, {}), values);
  assert.strictEqual(only.frame.top, 24);
  assert.ok(only.frame.left > 20);
});

test("cm.plane shares a position's scale with the contexts that give it the same name", () => {
  const root = cm.flow().renderer(cm.svg({width: 100, height: 100}));
  const length = (v) => ({value: () => v, scale: "length"});
  const [scatter, top, right] = root
    .branch(
      (flow) => flow.data([0]).transform(cm.encode, {x: length(30), y: () => 15}),
      (flow) => flow.data([0]).transform(cm.encode, {x: length(60), y: () => 40}),
      (flow) => flow.data([0]).transform(cm.encode, {x: () => 80, y: () => 20}),
    )
    .transform(cm.plane);
  const domains = (flow) => [flow._values[0].scales.x.domain, flow._values[0].scales.y.domain];
  // Length is shared by the scatter and the top; the right's x keeps the scale named x; y is shared.
  assert.deepStrictEqual(domains(scatter), [
    [30, 60],
    [15, 40],
  ]);
  assert.deepStrictEqual(domains(top), domains(scatter));
  assert.deepStrictEqual(domains(right), [
    [80, 80],
    [15, 40],
  ]);
});

test("cm.plane resolves a named scale independently, and applies the options of scales by name", () => {
  const root = cm.flow().renderer(cm.svg({width: 100, height: 100}));
  const [a, b, c] = root
    .branch(
      (flow) => flow.data([0]).transform(cm.encode, {x: {value: () => 1, scale: "n"}}),
      (flow) => flow.data([0]).transform(cm.encode, {x: {value: () => 2, scale: "n"}}),
      (flow) => flow.data([0]).transform(cm.encode, {x: () => 3}),
    )
    .transform(cm.plane, {resolve: {n: "independent"}, x: {domain: [0, 10]}});
  const domain = (flow) => flow._values[0].scales.x.domain;
  assert.deepStrictEqual(
    [domain(a), domain(b), domain(c)],
    [
      [1, 1],
      [2, 2],
      [0, 10],
    ],
  );
});

test("cm.plane joins a channel to a named scale only in the contexts that name it", () => {
  const plane = (options) => {
    const root = cm.flow().renderer(cm.svg({width: 100, height: 100}));
    const [, b] = root
      .branch(
        (flow) =>
          flow.data([{v: 1}]).transform(cm.encode, {
            x: {value: () => 0, scale: "length"},
            v: {value: "v", scale: "length"},
          }),
        (flow) => flow.data([{v: 50}]).transform(cm.encode, {x: () => 10, v: "v"}),
      )
      .transform(cm.plane, options);
    return b._values[0];
  };
  // The second branch's v isn't a position: it stays 50, without a scale.
  const {value, scales} = plane();
  assert.deepStrictEqual(value.v, [50]);
  assert.strictEqual(scales.v, undefined);
  assert.deepStrictEqual(plane({resolve: {x: "independent"}}).scales.x.domain, [10, 10]);
});

test("cm.plane keeps each position on its own axis when x and y name the same scale", () => {
  const root = cm.flow().renderer(cm.svg({width: 100, height: 100}));
  const [context] = root
    .data([{a: 0}, {a: 1}])
    .transform(cm.encode, {x: {value: "a", scale: "length"}, y: {value: "a", scale: "length"}})
    .transform(cm.plane, {margin: 0})._values;
  assert.deepStrictEqual(context.value.x, [0, 100]);
  assert.deepStrictEqual(context.value.y, [100, 0]);
});

test("cm.plane draws a chart in a keyframe at the root as a chart at the root", () => {
  const renderer = cm.svg({width: 200, height: 100});
  const [context] = cm
    .flow()
    .renderer(renderer)
    .append(cm.keyframe)
    .data([0, 10])
    .transform(cm.encode, {x: (d) => d})
    .transform(cm.plane)._values;
  // The default margins of a chart, not the box of a glyph.
  assert.deepStrictEqual([context.frame.left, context.frame.right], [20, 180]);
});

test("cm.plane({clip: true}) clips marks to the frame, but not axes", () => {
  const renderer = cm.svg({width: 200, height: 100});
  cm.flow()
    .renderer(renderer)
    .data([0, 1])
    .transform(cm.encode, {x: (d) => d, y: (d) => d})
    .transform(cm.plane, {margin: 10, clip: true})
    .add(cm.axis)
    .add(cm.circle, {r: 3})
    .render();
  const node = renderer.node();
  const rect = node.querySelector("clipPath > rect");
  assert.deepStrictEqual(
    ["x", "y", "width", "height"].map((name) => +rect.getAttribute(name)),
    [10, 10, 180, 80],
  );
  for (const circle of node.querySelectorAll("circle")) assert.ok(circle.closest("[clip-path]"));
  assert.ok(node.querySelector("line, text"));
  for (const tick of node.querySelectorAll("line, text")) assert.ok(!tick.closest("[clip-path]"));
});

test("cm.plane({clip: true}) clips the marks of a nested chart to its cell", () => {
  const [, [a, b]] = facets(columns, {y: "v"}, {clip: true});
  assert.deepStrictEqual(a.clip, {x: 0, y: -50, width: 100, height: 100});
  assert.deepStrictEqual(b.clip, a.clip);
});

test("cm.plane doesn't clip by default", () => {
  const [renderer, [a]] = facets(columns, {y: "v"});
  assert.strictEqual(a.clipped, false);
  assert.strictEqual(renderer.node().querySelector("[clip-path]"), null);
});

// A clipped or unclipped plane with a rect and a text, each with its own options.
function clipMarks(plane, rect, text) {
  const renderer = cm.svg({width: 200, height: 100});
  const root = cm.flow().renderer(renderer);
  root
    .data([0, 1])
    .transform(cm.encode, {x: (d) => d, y: (d) => d})
    .transform(cm.plane, {margin: 10, x: {axis: null}, y: {axis: null}, ...plane})
    .add(cm.rect, {width: 5, height: 5, ...rect})
    .add(cm.text, {text: "a", ...text});
  root.render();
  const node = renderer.node();
  return ["rect", "text"].map((name) =>
    Array.from(node.querySelectorAll(name))
      .filter((element) => !element.closest("clipPath"))
      .map((element) => !!element.closest("[clip-path]")),
  );
}

test("a mark's clip option overrides the clip of its plane", () => {
  assert.deepStrictEqual(clipMarks({clip: true}, {}, {clip: false}), [
    [true, true],
    [false, false],
  ]);
  assert.deepStrictEqual(clipMarks({}, {clip: true}, {}), [
    [true, true],
    [false, false],
  ]);
});

test("cm.plane({clip: true}) also clips the marks appended to a clipped mark", () => {
  const renderer = cm.svg({width: 200, height: 100});
  const root = cm.flow().renderer(renderer);
  root
    .data([0, 1])
    .transform(cm.encode, {x: (d) => d, y: (d) => d})
    .transform(cm.plane, {margin: 10, clip: true})
    .append(cm.g)
    .append(cm.circle, {x: 0, y: 0, r: 300});
  root.render();
  const circles = renderer.node().querySelectorAll("circle");
  assert.strictEqual(circles.length, 2);
  for (const circle of circles) assert.ok(circle.closest("[clip-path]"));
});

test("cm.plane takes the options of a named scale, such as its type and label", () => {
  const root = cm.flow().renderer(cm.svg({width: 100, height: 100}));
  const [context] = root
    .data([1, 10, 100])
    .transform(cm.encode, {x: {value: (d) => d, scale: "length"}, y: 0})
    .transform(cm.plane, {margin: 0, length: {type: "log", label: "Length"}})._values;
  assert.deepStrictEqual(context.value.x, [0, 50, 100]);
  assert.strictEqual(context.scales.x.label, "Length");
});

test("cm.plane labels a scale with its label option, or none with null", () => {
  const root = cm.flow().renderer(cm.svg({width: 100, height: 100}));
  const flow = root.data(genres).transform(cm.encode, {x: "genre", y: "sold", fill: "genre"}).transform(cm.spreadX);
  const [labeled] = flow.transform(cm.plane, {y: {label: "Sold"}, fill: {label: "Genre"}})._values;
  assert.strictEqual(labeled.scales.y.label, "Sold");
  assert.strictEqual(labeled.scales.fill.label, "Genre");
  const [unlabeled] = flow.transform(cm.plane, {x: {label: null}})._values;
  assert.strictEqual(unlabeled.scales.x.label, null);
});

test("cm.plane keeps the bands of a spread, whose order is cm.spreadX's domain, over the domain of scales", () => {
  const root = cm.flow().renderer(cm.svg({width: 100, height: 100}));
  const [context] = root
    .data(genres)
    .transform(cm.encode, {x: "genre", y: "sold"})
    .transform(cm.spreadX, {domain: ["Strategy", "Sports", "Action"]})
    .transform(cm.plane, {x: {domain: [0, 10], type: "linear"}})._values;
  assert.strictEqual(context.scales.x.type, "band");
  assert.deepStrictEqual(context.scales.x.domain, ["Strategy", "Sports", "Action"]);
});

test("cm.plane colors stacked series in the order of the stack, without repeating it", () => {
  const root = cm.flow().renderer(cm.svg({width: 100, height: 100}));
  const [context] = root
    .data(genres)
    .transform(cm.encode, {x: () => "all", y: "sold", fill: "genre"})
    .transform(cm.spreadX)
    .transform(cm.stackY, {order: ["Strategy", "Sports", "Action"]})
    .transform(cm.plane)._values;
  assert.deepStrictEqual(context.scales.fill.domain, ["Strategy", "Sports", "Action"]);
});

test("cm.plane takes the options and recorded domains of colors from any context with the color", () => {
  const root = cm.flow().renderer(cm.svg({width: 100, height: 100}));
  const [, second] = root
    .branch(
      (flow) => flow.data([0]).transform(cm.encode, {x: () => 0, y: () => 0}),
      (flow) => flow.data([{age: "old"}]).transform(cm.encode, {x: () => 1, y: () => 1, fill: "age"}),
    )
    .transform(cm.plane, {fill: {domain: ["old"], range: ["red"]}});
  assert.deepStrictEqual(second._values[0].value.fill, ["red"]);
  const rows = [
    {k: "A", age: "a", n: 1},
    {k: "A", age: "b", n: 2},
  ];
  const [, stacked] = cm
    .flow()
    .renderer(cm.svg({width: 100, height: 100}))
    .branch(
      (flow) => flow.data(rows).transform(cm.encode, {x: "k", y: "n", fill: "age"}).transform(cm.spreadX),
      (flow) =>
        flow
          .data(rows)
          .transform(cm.encode, {x: "k", y: "n", fill: "age"})
          .transform(cm.spreadX)
          .transform(cm.stackY, {order: ["b", "a"]}),
    )
    .transform(cm.plane);
  assert.deepStrictEqual(stacked._values[0].scales.fill.domain, ["b", "a"]);
});

test("cm.plane doesn't apply the domain of scales to bands that share the scale with a linear position", () => {
  const plane = (options) => {
    const flows = cm
      .flow()
      .renderer(cm.svg({width: 200, height: 200}))
      .branch(
        (flow) =>
          flow
            .data(["a", "b"])
            .transform(cm.encode, {x: 0, y: (d) => d})
            .transform(cm.spreadY),
        (flow) => flow.data([50]).transform(cm.encode, {x: 0, y: (d) => d}),
      )
      .transform(cm.plane, {margin: 0, ...options});
    return Array.from(flows, (flow) => flow._values[0]);
  };
  const [bands, linear] = plane({y: {domain: [0, 100], type: "linear"}});
  const [unset, unsetLinear] = plane();
  // The options come back through neither context: the scale is resolved as without them.
  assert.deepStrictEqual(bands.value.y, unset.value.y);
  assert.deepStrictEqual(linear.value.y, unsetLinear.value.y);
  assert.strictEqual(bands.scales.y.type, "band");
});

function assertAllInDelta(actual, expected) {
  assert.strictEqual(actual.length, expected.length);
  actual.forEach((d, i) => assertInDelta(d, expected[i]));
}

test("cm.plane scales r by a square root from 0, with the first quartile of positive values at 3px, like Plot", () => {
  const {r} = encoded([1, 4, 4, 16], {x: (d) => d, r: (d) => d});
  // The first quartile is 3.25, so r is 3 · √(v / 3.25).
  assertInDelta(r[0], 3 * Math.sqrt(1 / 3.25));
  assertInDelta(r[3], 3 * Math.sqrt(16 / 3.25));
  // The largest radius is at most 30px.
  const {r: capped} = encoded([1, 1, 1, 10000], {x: (d) => d, r: (d) => d});
  assertInDelta(capped[3], 30);
});

test("cm.plane takes the type, domain and range of r in scales, and leaves constant radii unscaled", () => {
  const {r} = encoded([0, 25, 100], {x: (d) => d, r: (d) => d}, {r: {range: [0, 10]}});
  assertAllInDelta(r, [0, 5, 10]);
  const {r: linear} = encoded([0, 25, 100], {x: (d) => d, r: (d) => d}, {r: {type: "linear", range: [0, 10]}});
  assertAllInDelta(linear, [0, 2.5, 10]);
  const {r: constant} = encoded([0, 1], {x: (d) => d, r: 3});
  assert.deepStrictEqual(constant, [3, 3]);
});

test("cm.plane scales fillOpacity and strokeOpacity linearly from 0 to [0, 1]", () => {
  const {fillOpacity, strokeOpacity} = encoded([0, 5, 10], {
    x: (d) => d,
    fillOpacity: (d) => d,
    strokeOpacity: (d) => d * 2,
  });
  assertAllInDelta(fillOpacity, [0, 0.5, 1]);
  assertAllInDelta(strokeOpacity, [0, 0.5, 1]);
  const {fillOpacity: given} = encoded(
    [0, 5, 10],
    {x: (d) => d, fillOpacity: (d) => d},
    {fillOpacity: {range: [0.2, 1]}},
  );
  assertAllInDelta(given, [0.2, 0.6, 1]);
  const {fillOpacity: constant} = encoded([0, 1], {x: (d) => d, fillOpacity: 0.5});
  assert.deepStrictEqual(constant, [0.5, 0.5]);
});

test("cm.plane records the scales of r and opacities, with the labels of their fields", () => {
  const root = cm.flow().renderer(cm.svg({width: 100, height: 100}));
  const [context] = root
    .data([{v: 4, o: 2}])
    .transform(cm.encode, {x: "v", r: "v", fillOpacity: "o"})
    .transform(cm.plane)._values;
  assert.deepStrictEqual(context.scales.r.domain, [0, 4]);
  assert.strictEqual(context.scales.r.label, "v");
  assert.deepStrictEqual(context.scales.fillOpacity.range, [0, 1]);
});

test("cm.plane takes named continuous types of positions, such as log", () => {
  const {y} = encoded([1, 10, 1000], {x: (d) => d, y: (d) => d}, {margin: 0, y: {type: "log"}});
  // y is up: 1 at the bottom, 1000 at the top, and 10 a third of the way, not in the middle as the
  // categories of a point scale would be.
  assertAllInDelta(y, [400, (400 * 2) / 3, 0]);
});

test("cm.plane leaves colors, radii and opacities as they are with the type identity", () => {
  const options = {r: {type: "identity"}, fillOpacity: {type: "identity"}, fill: {type: "identity"}};
  const {r, fillOpacity, fill} = encoded(
    [
      {s: 2, o: 0.3, c: "a"},
      {s: 8, o: 0.6, c: "b"},
    ],
    {x: "s", r: "s", fillOpacity: "o", fill: "c"},
    options,
  );
  assert.deepStrictEqual(
    [r, fillOpacity, fill],
    [
      [2, 8],
      [0.3, 0.6],
      ["a", "b"],
    ],
  );
});

test("cm.plane infers the domain of a log scale from the positive values, like Plot", () => {
  // A log opacity or radius isn't from 0.
  const {fillOpacity} = encoded([1, 10, 100], {x: (d) => d, fillOpacity: (d) => d}, {fillOpacity: {type: "log"}});
  assertAllInDelta(fillOpacity, [0, 0.5, 1]);
  const {r} = encoded([1, 10, 100], {x: (d) => d, r: (d) => d}, {r: {type: "log", range: [1, 10]}});
  assertAllInDelta(r, [1, 5.5, 10]);
  // A log position skips zeros, rather than mapping every row to NaN.
  const {y} = encoded([0, 1, 10, 100], {x: (d) => d, y: (d) => d}, {margin: 0, y: {type: "log"}});
  assertAllInDelta(y.slice(1), [400, 200, 0]);
  // Entirely negative values take their own extent.
  const {y: negative} = encoded([-1, -10, -100], {x: (d) => d, y: (d) => d}, {margin: 0, y: {type: "log"}});
  assert.ok(negative.every((v) => Number.isFinite(v)));
});

test("cm.plane applies the exponent of pow, the base of log and the constant of symlog", () => {
  const {y} = encoded([0, 2, 4], {x: (d) => d, y: (d) => d}, {margin: 0, y: {type: "pow", exponent: 2}});
  // 2 is 4/16 of the way up from the bottom, at 400 - 100.
  assertAllInDelta(y, [400, 300, 0]);
  const {r} = encoded([0, 2, 4], {x: (d) => d, r: (d) => d}, {r: {type: "pow", exponent: 2, range: [0, 16]}});
  assertAllInDelta(r, [0, 4, 16]);
  const symlog = (constant) =>
    encoded([-10, 1, 10], {x: (d) => d, y: (d) => d}, {margin: 0, y: {type: "symlog", constant}}).y[1];
  assert.ok(Math.abs(symlog(1) - symlog(10)) > 1);
  const root = cm.flow().renderer(cm.svg({width: 640, height: 400}));
  const [context] = root
    .data([1, 1000])
    .transform(cm.encode, {x: (d) => d, y: (d) => d})
    .transform(cm.plane, {y: {type: "log", base: 2}})._values;
  assert.strictEqual(context.scales.y.type.base(), 2);
});

test("cm.plane records the guides of its scales from their options, in context.guides", () => {
  const flow = cm
    .flow()
    .renderer(cm.svg({width: 100, height: 100}))
    .data([{v: 1, k: "a"}])
    .transform(cm.encode, {x: "v", y: {value: "v", scale: "length"}, fill: "k"});
  const [{guides}] = flow.transform(cm.plane, {
    x: {axis: "both", grid: true, domain: [0, 2]},
    length: {axis: "right", tickFormat: "d"},
    fill: {legend: true, width: 100, scheme: "Set1"},
  })._values;
  assert.deepStrictEqual(guides.x, {name: "x", anchors: ["bottom", "top"], grid: true});
  assert.deepStrictEqual(guides.y, {name: "length", anchors: ["right"], tickFormat: "d"});
  assert.deepStrictEqual(guides.legends, {fill: {width: 100, anchor: "top"}});
  // By default, axes at the bottom and the left, and no legends; null hides an axis.
  const [defaults] = flow.transform(cm.plane, {length: {axis: null}})._values;
  assert.deepStrictEqual([defaults.guides.x.anchors, defaults.guides.y.anchors], [["bottom"], []]);
  assert.deepStrictEqual(defaults.guides.legends, {});
});

test("cm.plane fits the margins it isn't given to what its axes draw on each side, and 3px", () => {
  const frame = (options) => {
    const flow = cm
      .flow()
      .renderer(cm.svg({width: 400, height: 300}))
      .data([{v: 0}, {v: 1}])
      .transform(cm.encode, {x: "v", y: (d) => d.v * 100});
    const plane = {
      ...options,
      x: {domain: [0, 1], ticks: [0, 1], ...options?.x},
      y: {domain: [0, 100], ticks: [0, 100], label: "Y", ...options?.y},
    };
    const [{frame}] = flow.transform(cm.plane, plane)._values;
    return [frame.top, 400 - frame.right, 300 - frame.bottom, frame.left].map((d) => Math.round(d * 10) / 10);
  };
  // Beside y, the tick 6, the padding 3 and the widest label, "100"; under or over x, the same 9
  // and a label 10, and its title, 6 + 10; over y, its level title past half a label: 5 + 6 + 10.
  const y = 3 + 6 + 3 + Math.round(widthOf("100") * 10) / 10;
  assert.deepStrictEqual(frame(), [24, 20, 38, y]);
  // A side without an axis has a floor: 10 over y, 20 elsewhere, past the ends of the labels.
  assert.deepStrictEqual(frame({x: {axis: "top"}, y: {axis: "right"}}), [38, y, 20, 20]);
  // With both, only the first side of x has a title; the level title of y, over the top axis of x,
  // still takes a row over its tick labels.
  assert.deepStrictEqual(frame({x: {axis: "both"}, y: {axis: "both"}}), [38, y, 38, y]);
  assert.deepStrictEqual(frame({x: {axis: "both"}, y: {axis: "both", label: null}}), [22, y, 38, y]);
  // A title turned beside y takes 6 + 10 more beside it, and none over it.
  assert.deepStrictEqual(frame({y: {labelAnchor: "center"}}), [10, 20, 38, y + 16]);
  // A level title at the bottom shares the row of the title of x, or takes one under its labels.
  assert.deepStrictEqual(frame({y: {labelAnchor: "bottom"}}), [10, 20, 38, y]);
  assert.deepStrictEqual(frame({x: {label: null}, y: {labelAnchor: "bottom"}}), [10, 20, 38, y]);
  // An axis without a title takes the room of its tick labels.
  assert.deepStrictEqual(frame({x: {label: null}, y: {label: null}}), [10, 20, 22, y]);
  assert.deepStrictEqual(frame({x: {axis: null}, y: {axis: null}}), [10, 20, 20, 20]);
  // Given margins come first.
  assert.deepStrictEqual(frame({marginLeft: 5, y: {axis: null}}), [10, 20, 38, 5]);
  // Wider tick labels take more room.
  assert.deepStrictEqual(
    frame({y: {tickFormat: (d) => `${d},000,000`}})[3],
    3 + 6 + 3 + Math.round(widthOf("100,000,000") * 10) / 10,
  );
});

test("cm.plane fits its margins to the ends of the tick labels of x, rotated tick labels, and legends", () => {
  const frame = (x, plane = {}, data = [{v: 0}, {v: 1}]) => {
    const flow = cm
      .flow()
      .renderer(cm.svg({width: 400, height: 300}))
      .data(data)
      .transform(cm.encode, {x: "v", ...plane.channels});
    const [{frame}] = flow.transform(cm.plane, {x: {domain: [0, 1], ...x}, ...plane.options})._values;
    return [frame.top, 400 - frame.right, 300 - frame.bottom, frame.left];
  };
  // Half the last tick label of x past the right of the plot, and 3px, past the floor of 20.
  const [, right] = frame({ticks: [1], tickFormat: () => "a very long label"});
  assertInDelta(right, widthOf("a very long label") / 2 + 3);
  // Labels turned by 45° reach under the plot by their rotated height.
  const [, , bottom] = frame({ticks: [0.5], tickFormat: () => "a long label", tickRotate: -45, label: null});
  const r = Math.PI / 4;
  assertInDelta(bottom, 3 + 6 + 3 + 4 * Math.cos(r) + widthOf("a long label") * Math.sin(r) + 10 * Math.cos(r));
  // A legend on the right starts past the end of the last tick label of x, half of "1.0", and takes
  // 12, its width and 3px.
  const [, legend] = frame({}, {channels: {fill: "k"}, options: {fill: {legend: "right"}}}, [
    {v: 0, k: "short"},
    {v: 1, k: "a longer one"},
  ]);
  assertInDelta(legend, widthOf("1.0") / 2 + 12 + Math.max(widthOf("k"), 10 + 4 + widthOf("a longer one")) + 3);
});

test("cm.plane sizes an auto height with the top and bottom margins of its axes", () => {
  const heightOf = (data, channels, options) => {
    const renderer = cm.svg();
    cm.flow().renderer(renderer).data(data).transform(cm.encode, channels).transform(cm.plane, options);
    return renderer._props.height;
  };
  const dots = [{v: 1}, {v: 2}];
  // Without y, a frame of 30px with the margins: 38 for the tick labels and title of x.
  assert.strictEqual(heightOf(dots, {x: "v"}), 30 + 38);
  assert.strictEqual(heightOf(dots, {x: "v"}, {x: {axis: "top"}}), 30 + 38 + 20);
  // With both, the second side has no title: its tick labels take 22.
  assert.strictEqual(heightOf(dots, {x: "v"}, {x: {axis: "both"}}), 30 + 22 + 38);
  // With a categorical y, 20px per category plus 10.
  const bars = [{k: "a", v: 1}];
  // Its title is turned beside the axis, at the middle, leaving the top to half a label.
  assert.strictEqual(heightOf(bars, {x: "v", y: "k"}), 20 + 10 + 10 + 38);
  assert.strictEqual(heightOf(bars, {x: "v", y: "k"}, {x: {axis: "both"}}), 20 + 10 + 22 + 38);
});

// The boxes of the texts of a chart, measured like Plot's text, turned around their anchors.
function textBoxes(node) {
  return Array.from(node.querySelectorAll("text"), (t) => {
    const [x, y, w, h] = [+t.getAttribute("x"), +t.getAttribute("y"), widthOf(t.textContent), 10];
    const anchor = t.getAttribute("text-anchor") ?? "start";
    const baseline = t.getAttribute("dominant-baseline");
    const a = anchor === "end" ? -w : anchor === "middle" ? -w / 2 : 0;
    const b = baseline === "text-before-edge" ? 0 : baseline === "central" ? -h / 2 : -h;
    const rotate = t.getAttribute("transform")?.match(/rotate\(([-\d.]+)/);
    const r = rotate ? (+rotate[1] * Math.PI) / 180 : 0;
    const corners = [
      [a, b],
      [a + w, b],
      [a, b + h],
      [a + w, b + h],
    ].map(([u, v]) => [x + u * Math.cos(r) - v * Math.sin(r), y + u * Math.sin(r) + v * Math.cos(r)]);
    const X = corners.map(([x]) => x);
    const Y = corners.map(([, y]) => y);
    return {text: t.textContent, x0: Math.min(...X), x1: Math.max(...X), y0: Math.min(...Y), y1: Math.max(...Y)};
  });
}

function assertInside(node, width, height) {
  for (const {text, x0, x1, y0, y1} of textBoxes(node)) {
    assert.ok(x0 >= -1e-6 && x1 <= width + 1e-6 && y0 >= -1e-6 && y1 <= height + 1e-6, text);
  }
}

test("cm.plane starts a legend on the right past the last tick label of x, which reaches past the plot", () => {
  const renderer = cm.svg({width: 400, height: 300});
  const root = cm.flow().renderer(renderer);
  root
    .data([
      {v: 0, k: "a"},
      {v: 1, k: "b"},
    ])
    .transform(cm.encode, {x: "v", y: "v", fill: "k"})
    .transform(cm.plane, {x: {ticks: [1], tickFormat: () => "a very long label"}, fill: {legend: "right"}})
    .add(cm.circle);
  root.render();
  const boxes = textBoxes(renderer.node());
  const label = boxes.find((d) => d.text === "a very long label");
  for (const swatch of boxes.filter((d) => d.text === "a" || d.text === "b")) assert.ok(swatch.x0 >= label.x1 + 12);
  assertInside(renderer.node(), 400, 300);
});

test("cm.plane fits tick labels of y turned by 60° or less, which end at their ticks", () => {
  for (const tickRotate of [-45, 45]) {
    const renderer = cm.svg({width: 400, height: 300});
    const root = cm.flow().renderer(renderer);
    root
      .data([{v: 0}, {v: 1}])
      .transform(cm.encode, {x: "v", y: "v"})
      .transform(cm.plane, {y: {ticks: [0, 1], tickFormat: () => "a rather long label", tickRotate}})
      .add(cm.circle);
    root.render();
    assertInside(renderer.node(), 400, 300);
  }
});

test("cm.plane fits a title longer than its axis, turned beside y, or under x", () => {
  // Two categories make an axis of about 50px, under a turned title of about 200: the margins over
  // and under it grow, and the auto height with them.
  const renderer = cm.svg();
  const root = cm.flow().renderer(renderer);
  root
    .data([
      {k: "a", v: 1},
      {k: "b", v: 2},
    ])
    .transform(cm.encode, {x: "v", y: "k"})
    .transform(cm.spreadY)
    .transform(cm.plane, {width: 200, y: {label: "a very long title of the categories"}})
    .add(cm.rect);
  root.render();
  assertInside(renderer.node(), 200, +renderer.node().getAttribute("height"));
});
