import assert from "node:assert";
import * as d3 from "d3";
import {test} from "vitest";
import "../../install-canvas-mock.js";
import * as cm from "../../../src/index.js";
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
  assert.deepStrictEqual(x, [40, 620]);
  assert.deepStrictEqual(y, [370, 20]);
});

test("cm.plane uses margin as the default of each side", () => {
  const {x, y} = values([0, 1], {x: (d) => d, y: (d) => d}, {margin: 10, marginLeft: 50});
  assert.deepStrictEqual(x, [50, 630]);
  assert.deepStrictEqual(y, [390, 10]);
});

test("cm.plane supports the options of cm.fit", () => {
  const {x, y} = values([0, 1], {x: (d) => d, y: (d) => d}, {reverseY: false, domainX: [0, 2]});
  assert.deepStrictEqual(x, [40, 330]);
  assert.deepStrictEqual(y, [20, 370]);
});

test("cm.plane places the bands of cm.spreadX like a band scale in the chart area", () => {
  const [shape, calls] = probe();
  const root = cm.flow().renderer(cm.canvas({width: 640, height: 400, dpi: 1}));
  root
    .data([
      {letter: "B", frequency: 2},
      {letter: "A", frequency: 1},
    ])
    .transform(cm.encode, {x: "letter", y: "frequency"})
    .transform(cm.spreadX)
    .transform(cm.plane)
    .add(shape);
  root.render();
  const [{x, y, y1}] = calls;
  const band = d3.scaleBand(["A", "B"], [40, 620]).padding(0.1);
  ["B", "A"].forEach((d, i) => assertInDelta(x[i], band(d)));
  assert.deepStrictEqual(y, [20, 195]);
  assert.deepStrictEqual(y1, [370, 370]);
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

test("cm.plane uses the scale, domain and range of a color descriptor", () => {
  const {fill} = encoded(genres, {
    x: "genre",
    y: "sold",
    fill: {value: "genre", domain: ["Strategy", "Sports", "Action"], range: ["red", "green", "blue"]},
  });
  assert.deepStrictEqual(fill, ["green", "red", "blue"]);
  const {fill: ordinal} = encoded(genres, {x: "genre", y: "sold", fill: {value: "sold", type: "ordinal"}});
  assert.deepStrictEqual(ordinal, ["#fac858", "#5470c6", "#91cc75"]);
});

test("cm.plane leaves constant colors unchanged, and maps numeric colors with turbo, like Plot", () => {
  const {fill, stroke} = encoded(genres, {x: "genre", y: "sold", fill: "red", stroke: "sold"});
  assert.deepStrictEqual(fill, ["red", "red", "red"]);
  assert.deepStrictEqual(stroke, [d3.interpolateTurbo(1), d3.interpolateTurbo(0), d3.interpolateTurbo(5 / 160)]);
});

test("cm.plane maps linear colors with the interpolator of a scheme, case-insensitive", () => {
  const {fill} = encoded(genres, {x: "genre", y: "sold", fill: {value: "sold", type: "linear", scheme: "piyg"}});
  assert.deepStrictEqual(fill, [d3.interpolatePiYG(1), d3.interpolatePiYG(0), d3.interpolatePiYG(5 / 160)]);
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
    range: [40, 620],
    label: "genre",
  });
  assert.deepStrictEqual(context.scales.y, {type: "linear", domain: [0, 275], range: [370, 20], label: "sold"});
});

test("cm.plane uses the domain and scale hinted for x and y, and explicit options override them", () => {
  const root = cm.flow().renderer(cm.canvas({width: 640, height: 400, dpi: 1}));
  const flow = root
    .data([0, 1])
    .transform(cm.bind, {x: (d) => d, y: (d) => d})
    .transform((_, data) => data.map((d) => ({...d, hints: {x: {domain: [0, 2]}, y: {type: "ordinal"}}})));
  const [hinted] = flow.transform(cm.plane, {margin: 0})._values;
  assert.deepStrictEqual(hinted.value.x, [0, 320]);
  assert.deepStrictEqual(hinted.value.y, [400, 0]);
  const [explicit] = flow.transform(cm.plane, {margin: 0, domainX: [0, 1]})._values;
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
    .transform(cm.plane, {margin: 0, typeY: sqrt})._values;
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
  const {fill} = encoded(data, {x: "x", y: 1, fill: {value: "date", type: "ordinal"}});
  assert.deepStrictEqual(fill, ["#5470c6", "#5470c6"]);
});

test("cm.plane records categorical positions as a point scale", () => {
  const root = cm.flow().renderer(cm.canvas({width: 640, height: 400, dpi: 1}));
  const [context] = root
    .data(["a", "b", "c"])
    .transform(cm.bind, {x: (d) => d, y: 0})
    .transform(cm.plane, {margin: 0, typeX: "ordinal"})._values;
  assert.deepStrictEqual(context.value.x, [0, 320, 640]);
  assert.strictEqual(context.scales.x.type, "point");
});

test("cm.plane uses the hints of x1 and y1, with x and y taking precedence", () => {
  const root = cm.flow().renderer(cm.canvas({width: 640, height: 400, dpi: 1}));
  const [context] = root
    .data([1, 2])
    .transform(cm.encode, {x: 0, x1: {value: (d) => d, domain: [0, 10]}, y: 0})
    .transform(cm.plane, {margin: 0})._values;
  assert.deepStrictEqual(context.value.x1, [64, 128]);
  assert.deepStrictEqual(context.scales.x.domain, [0, 10]);
});

function planed(renderer, data, channels, options) {
  const root = cm.flow().renderer(renderer);
  return root.data(data).transform(cm.encode, channels).transform(cm.plane, options)._values[0];
}

test("cm.plane sizes a renderer without a size like Plot: 640 by 60 without y, with x in the middle", () => {
  const renderer = cm.svg();
  const context = planed(renderer, [1, 2, 3], {x: (d) => d});
  assert.deepStrictEqual([renderer._props.width, renderer._props.height], [640, 60]);
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
  assert.strictEqual(renderer._props.height, 3 * 20 + 60);
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

test("cm.plane sizes the chart with its typeY and domainY options", () => {
  const ordinal = cm.svg();
  planed(ordinal, [1, 2], {x: (d) => d, y: (d) => d}, {typeY: "ordinal"});
  assert.strictEqual(ordinal._props.height, 2 * 20 + 60);
  const domain = cm.svg();
  planed(domain, ["a", "b"], {x: 1, y: (d) => d}, {domainY: ["a", "b", "c", "d"]});
  assert.strictEqual(domain._props.height, 4 * 20 + 60);
});

test("cm.plane places the bands of cm.spreadY from the top, unless reverseY is set", () => {
  const data = [
    {letter: "B", frequency: 2},
    {letter: "A", frequency: 1},
  ];
  const root = cm.flow().renderer(cm.svg({width: 640, height: 400}));
  const flow = root.data(data).transform(cm.encode, {x: "frequency", y: "letter"}).transform(cm.spreadY);
  const [context] = flow.transform(cm.plane)._values;
  const band = d3.scaleBand(["A", "B"], [20, 370]).padding(0.1);
  ["B", "A"].forEach((d, i) => assertInDelta(context.value.y[i], band(d)));
  assert.deepStrictEqual(context.scales.y.type, "band");
  assert.deepStrictEqual(context.scales.y.domain, ["A", "B"]);
  assert.deepStrictEqual(context.scales.y.range, [20, 370]);
  const [reversed] = flow.transform(cm.plane, {reverseY: true})._values;
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
  assert.strictEqual(context.frame.top, 20);
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
