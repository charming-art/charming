import assert from "node:assert";
import {test} from "vitest";
import "../../install-canvas-mock.js";
import * as cm from "../../../src/index.js";
import {assertInDelta} from "../../helpers.js";

// Renders a chart of the channels with cm.legend and returns the renderer's node.
function legend(channels, options, plane = {}, width = 400) {
  const renderer = cm.svg({width, height: 200});
  const root = cm.flow().renderer(renderer);
  root
    .data([
      {k: "a", v: 1},
      {k: "b", v: 4},
      {k: "c", v: 9},
    ])
    .transform(cm.encode, {x: "v", y: "v", ...channels})
    .transform(cm.plane, {marginRight: 150, x: {axis: null}, y: {axis: null}, ...plane})
    .add(cm.legend, options);
  root.render();
  return renderer.node();
}

const texts = (node) => Array.from(node.querySelectorAll("text"), (t) => t.textContent);
const rects = (node) => Array.from(node.querySelectorAll("rect"));

test("cm.legend draws a swatch per category of a color, labeled, after the title of the scale", () => {
  const node = legend({fill: "k"});
  assert.deepStrictEqual(texts(node), ["k", "a", "b", "c"]);
  assert.deepStrictEqual(
    rects(node).map((r) => r.getAttribute("fill")),
    ["#5470c6", "#91cc75", "#fac858"],
  );
});

test("cm.legend draws a ramp for a continuous color, with ticks, within the margin", () => {
  const node = legend({fill: "v"});
  const slices = rects(node);
  assert.strictEqual(slices.length, 64);
  // The ramp narrows to fit the margin, ending 3px from the right of the chart.
  const last = slices[63];
  assert.ok(+last.getAttribute("x") + +last.getAttribute("width") <= 400 - 3 + 1e-6);
  // The ramp goes from the color of the lowest value to that of the highest.
  assert.notStrictEqual(slices[0].getAttribute("fill"), slices[63].getAttribute("fill"));
  assert.ok(texts(node).includes("v"));
  assert.ok(texts(node).some((t) => /^\d/.test(t)));
});

test("cm.legend draws a ramp of opacities in the current color", () => {
  const node = legend({fillOpacity: "v"});
  const slices = rects(node);
  assert.strictEqual(slices[0].getAttribute("fill"), "currentColor");
  assert.ok(+slices[0].getAttribute("fill-opacity") < +slices[63].getAttribute("fill-opacity"));
});

test("cm.legend draws circles at a few ticks of a radius, sized by its scale, each labeled", () => {
  const node = legend({r: "v"});
  const circles = Array.from(node.querySelectorAll("circle"), (c) => +c.getAttribute("r"));
  assert.ok(circles.length >= 2);
  assert.deepStrictEqual(
    circles,
    circles.slice().sort((a, b) => a - b),
  );
  assert.ok(texts(node).includes("v"));
});

test("cm.legend takes options per scale, such as a label, or false to skip a legend", () => {
  const node = legend({fill: "k", r: "v"}, {fill: {label: "Kind"}, r: false});
  assert.deepStrictEqual(texts(node), ["Kind", "a", "b", "c"]);
  assert.strictEqual(node.querySelectorAll("circle").length, 0);
  assert.deepStrictEqual(texts(legend({fill: "k"}, {label: null})), ["a", "b", "c"]);
});

test("cm.legend stacks its legends in a column right of the frame, from its top", () => {
  const node = legend({fill: "k", r: "v"});
  // The frame ends at 400 - 150 and starts at 10; the column starts 12px right of it.
  const [title] = node.querySelectorAll("text");
  assert.deepStrictEqual([+title.getAttribute("x"), +title.getAttribute("y")], [400 - 150 + 12, 10]);
  const swatches = rects(node);
  assert.deepStrictEqual(new Set(swatches.map((r) => r.getAttribute("x"))).size, 1);
  const ys = swatches.map((r) => +r.getAttribute("y"));
  assert.deepStrictEqual(
    ys,
    ys.slice().sort((a, b) => a - b),
  );
  // The size legend is under the swatches.
  const circles = Array.from(node.querySelectorAll("circle"), (c) => +c.getAttribute("cy") - +c.getAttribute("r"));
  assert.ok(circles.every((top) => top > ys[ys.length - 1]));
  // Its circles are aligned at their tops.
  assert.strictEqual(new Set(circles.map((d) => Math.round(d * 1e6))).size, 1);
});

test("cm.legend draws nothing in charts nested in a chart, nor without scales to show", () => {
  const renderer = cm.svg({width: 200, height: 100});
  const root = cm.flow().renderer(renderer);
  root
    .data(["A", "B"])
    .transform(cm.encode, {x: (d) => d})
    .transform(cm.spreadX)
    .transform(cm.plane, {x: {axis: null}})
    .append(cm.g)
    .data([{k: "a"}])
    .transform(cm.encode, {fill: "k"})
    .transform(cm.plane)
    .add(cm.legend);
  root.render();
  assert.strictEqual(renderer.node().querySelectorAll("text").length, 0);
  assert.strictEqual(texts(legend({})).length, 0);
});

test("cm.legend in cm.polar stacks its legends right of the disc, from its top", () => {
  const renderer = cm.svg({width: 400, height: 300});
  const root = cm.flow().renderer(renderer);
  root
    .data([
      {k: "a", v: 1},
      {k: "b", v: 2},
    ])
    .transform(cm.encode, {x: "v", fill: "k"})
    .transform(cm.stackX)
    .transform(cm.polar, {margin: 20, marginRight: 120})
    .add(cm.arc)
    .add(cm.legend);
  root.render();
  // The disc is centered in the box from 20 to 280 and 20 to 280: radius 130, its right at 280.
  const [title] = Array.from(renderer.node().querySelectorAll("text"));
  assert.deepStrictEqual([+title.getAttribute("x"), +title.getAttribute("y")], [280 + 12, 20]);
  assert.ok(rects(renderer.node()).every((r) => +r.getAttribute("x") < 400));
});

// Renders a legend of a channel over the given values, in a margin of the given width, and returns
// the renderer's node.
function margin(values, channels, marginRight, plane = {}) {
  const renderer = cm.svg({width: 400, height: 300});
  const root = cm.flow().renderer(renderer);
  root
    .data(values)
    .transform(cm.encode, {x: (d) => d.v, y: (d) => d.v, ...channels})
    .transform(cm.plane, {marginRight, x: {axis: null}, y: {axis: null}, ...plane})
    .add(cm.legend);
  root.render();
  return renderer.node();
}

test("cm.legend aligns the labels at the ends of a ramp inward, so that they stay within it", () => {
  const node = margin([{v: 0}, {v: 10}], {fill: (d) => d.v}, 150);
  const ticks = Array.from(node.querySelectorAll("text")).filter((t) => /^\d+$/.test(t.textContent));
  assert.strictEqual(ticks[0].getAttribute("text-anchor"), "start");
  assert.strictEqual(ticks[ticks.length - 1].getAttribute("text-anchor"), "end");
  assert.strictEqual(+ticks[ticks.length - 1].getAttribute("x"), 400 - 3);
});

test("cm.legend places the ticks of a ramp through its scale, such as a log opacity", () => {
  const node = margin([{v: 1}, {v: 1000}], {fillOpacity: (d) => d.v}, 250, {fillOpacity: {type: "log"}});
  const x = (t) =>
    +Array.from(node.querySelectorAll("text"))
      .find((d) => d.textContent === t)
      .getAttribute("x");
  // 1, 10, 100 and 1000 are evenly spaced, as on a log axis.
  assertInDelta(x("10") - x("1"), x("100") - x("10"));
  assertInDelta(x("100") - x("10"), x("1k") - x("100"));
});

test("cm.legend keeps sizes within the margin, dropping the ticks in the middle", () => {
  // Mostly small values: the default range puts the largest radius at 30px, so 5,000 and 10,000
  // side by side are 110px wide, wider than the 85px the margin leaves.
  const node = margin([{v: 1}, {v: 1}, {v: 1}, {v: 10000}], {r: (d) => d.v}, 100);
  const circles = Array.from(node.querySelectorAll("circle"));
  assert.strictEqual(circles.length, 1);
  for (const c of circles) assert.ok(+c.getAttribute("cx") + +c.getAttribute("r") <= 400);
});

test("cm.legend shortens swatch labels that are wider than the margin", () => {
  const node = margin([{v: 1, k: "Transportation and Utilities"}], {fill: (d) => d.k}, 100);
  const label = Array.from(node.querySelectorAll("text")).find((t) => t.textContent.startsWith("Transp"));
  assert.ok(label.textContent.endsWith("…"));
  assert.ok(+label.getAttribute("x") + label.textContent.length * 6 <= 400);
});

test("cm.plane draws the legends of the scales given legend true, with their options", () => {
  const chart = (plane, add = (flow) => flow) => {
    const renderer = cm.svg({width: 400, height: 200});
    const root = cm.flow().renderer(renderer);
    add(
      root
        .data([
          {k: "a", v: 1},
          {k: "b", v: 4},
        ])
        .transform(cm.encode, {x: "v", y: "v", fill: "k", r: "v"})
        .transform(cm.plane, {marginRight: 150, x: {axis: null}, y: {axis: null}, ...plane}),
    );
    root.render();
    return texts(renderer.node());
  };
  // No legends unless asked, like Plot.
  assert.deepStrictEqual(chart(), []);
  assert.deepStrictEqual(chart({fill: {legend: true}}), ["k", "a", "b"]);
  assert.deepStrictEqual(chart({fill: {legend: true, tickFormat: (d) => d.toUpperCase()}}), ["k", "A", "B"]);
  assert.deepStrictEqual(
    chart({fill: {legend: true}}),
    chart({}, (flow) => flow.add(cm.legend, {r: false})),
  );
  // An explicit legend replaces the implicit ones, and takes their options.
  assert.deepStrictEqual(
    chart({fill: {legend: true, tickFormat: (d) => d.toUpperCase()}}, (flow) => flow.add(cm.legend, {r: false})),
    ["k", "A", "B"],
  );
  assert.deepStrictEqual(
    chart({fill: {legend: true}}, (flow) => flow.add(cm.legend, {fill: false, r: false})),
    [],
  );
});
