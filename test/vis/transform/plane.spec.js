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
  const {fill: ordinal} = encoded(genres, {x: "genre", y: "sold", fill: {value: "sold", scale: "ordinal"}});
  assert.deepStrictEqual(ordinal, ["#fac858", "#5470c6", "#91cc75"]);
});

test("cm.plane leaves constant colors and numeric colors without a scale unchanged", () => {
  const {fill, stroke} = encoded(genres, {x: "genre", y: "sold", fill: "red", stroke: "sold"});
  assert.deepStrictEqual(fill, ["red", "red", "red"]);
  assert.deepStrictEqual(stroke, [275, 115, 120]);
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
    scale: "band",
    domain: ["Action", "Sports", "Strategy"],
    paddingInner: 0.1,
    paddingOuter: 0.1,
    align: 0.5,
    range: [40, 620],
    label: "genre",
  });
  assert.deepStrictEqual(context.scales.y, {scale: "linear", domain: [0, 275], range: [370, 20], label: "sold"});
});

test("cm.plane uses the domain and scale hinted for x and y, and explicit options override them", () => {
  const root = cm.flow().renderer(cm.canvas({width: 640, height: 400, dpi: 1}));
  const flow = root
    .data([0, 1])
    .transform(cm.bind, {x: (d) => d, y: (d) => d})
    .transform((_, data) => data.map((d) => ({...d, hints: {x: {domain: [0, 2]}, y: {scale: "ordinal"}}})));
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
  assert.deepStrictEqual(context.scales.x, {scale: "linear", domain: [0, 2], range: [0, 640]});
  assert.deepStrictEqual(context.scales.x1, context.scales.x);
  assert.deepStrictEqual(context.value.x1, [320, 640]);
});

test("cm.plane records a copied d3 scale with its resolved domain and range", () => {
  const scaleY = d3.scaleSqrt();
  const root = cm.flow().renderer(cm.canvas({width: 640, height: 400, dpi: 1}));
  const [context] = root
    .data([0, 4])
    .transform(cm.bind, {x: (d) => d, y: (d) => d})
    .transform(cm.plane, {margin: 0, scaleY})._values;
  const {scale, domain, range} = context.scales.y;
  assert.notStrictEqual(scale, scaleY);
  assert.deepStrictEqual(scale.domain(), [0, 4]);
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
  const {fill} = encoded(data, {x: "x", y: 1, fill: {value: "date", scale: "ordinal"}});
  assert.deepStrictEqual(fill, ["#5470c6", "#5470c6"]);
});

test("cm.plane records categorical positions as a point scale", () => {
  const root = cm.flow().renderer(cm.canvas({width: 640, height: 400, dpi: 1}));
  const [context] = root
    .data(["a", "b", "c"])
    .transform(cm.bind, {x: (d) => d, y: 0})
    .transform(cm.plane, {margin: 0, scaleX: "ordinal"})._values;
  assert.deepStrictEqual(context.value.x, [0, 320, 640]);
  assert.strictEqual(context.scales.x.scale, "point");
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
