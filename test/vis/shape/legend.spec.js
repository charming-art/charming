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
    .transform(cm.plane, {marginTop: 60, ...plane})
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

test("cm.legend aligns its row to the right of the chart, at the top, by default", () => {
  const node = legend({fill: "k"});
  const right = Math.max(
    ...Array.from(node.querySelectorAll("text"), (t) => +t.getAttribute("x") + t.textContent.length * 6),
  );
  assert.strictEqual(right, 400 - 3);
  assert.ok(rects(node).every((r) => +r.getAttribute("y") < 20));
});

test("cm.legend wraps swatches within the width of the chart", () => {
  const node = legend({fill: "k"}, {}, {}, 80);
  const ys = new Set(rects(node).map((r) => r.getAttribute("y")));
  assert.ok(ys.size > 1);
});

test("cm.legend draws a ramp for a continuous color, with ticks", () => {
  const node = legend({fill: "v"});
  const slices = rects(node);
  assert.strictEqual(slices.length, 64);
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

test("cm.legend with anchor right stacks its legends in a column right of the frame", () => {
  const node = legend({fill: "k"}, {anchor: "right"}, {marginRight: 100});
  const xs = rects(node).map((r) => +r.getAttribute("x"));
  assert.deepStrictEqual(new Set(xs).size, 1);
  assert.strictEqual(xs[0], 400 - 100 + 12);
  const ys = rects(node).map((r) => +r.getAttribute("y"));
  assert.deepStrictEqual(
    ys,
    ys.slice().sort((a, b) => a - b),
  );
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
