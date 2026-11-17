import assert from "node:assert";
import {test} from "vitest";
import "../../install-canvas-mock.js";
import * as cm from "../../../src/index.js";

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
    .transform(cm.plane, {marginRight: 150, ...plane})
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
  assert.ok(+last.getAttribute("x") + +last.getAttribute("width") <= 400 - 3 + 1);
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
  // The frame ends at 400 - 150 and starts at 20; the column starts 12px right of it.
  const [title] = node.querySelectorAll("text");
  assert.deepStrictEqual([+title.getAttribute("x"), +title.getAttribute("y")], [400 - 150 + 12, 20]);
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
    .transform(cm.plane)
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
