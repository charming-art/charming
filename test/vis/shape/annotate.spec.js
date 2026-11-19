import assert from "node:assert";
import * as d3 from "d3";
import {test} from "vitest";
import * as cm from "../../../src/index.js";
import {assertInDelta} from "../../helpers.js";

// Renders a chart of x in [0, 10] and y in [0, 100] on a 200 × 200 frame with an annotation, and
// returns the elements of the annotation.
function annotation(shape, options, {coordinate = cm.plane, selector} = {}) {
  const renderer = cm.svg({width: 200, height: 200});
  const root = cm.flow().renderer(renderer);
  root
    .data([
      {x: 0, y: 0},
      {x: 10, y: 100},
    ])
    .transform(cm.encode, {x: "x", y: "y"})
    .transform(coordinate, {
      margin: 0,
      x: {axis: null},
      y: {axis: null, ...(coordinate === cm.polar && {type: "linear"})},
    })
    .add(cm.annotate(shape), options);
  root.render();
  return Array.from(renderer.node().querySelectorAll(selector));
}

const attributes = (element, ...names) => names.map((name) => +element.getAttribute(name));

test("cm.annotate(cm.link) with only x is a rule across the frame", () => {
  const [line] = annotation(cm.link, {x: 5, stroke: "red"}, {selector: "line"});
  assert.deepStrictEqual(attributes(line, "x1", "y1", "x2", "y2"), [100, 0, 100, 200]);
  assert.strictEqual(line.getAttribute("stroke"), "red");
});

test("cm.annotate(cm.rect) with x and x1 is a band across the frame", () => {
  const [rect] = annotation(cm.rect, {x: 2, x1: 4, fillOpacity: 0.1}, {selector: "rect"});
  assert.deepStrictEqual(attributes(rect, "x", "y", "width", "height"), [40, 0, 40, 200]);
});

test("cm.annotate(cm.circle) with only x sits in the middle of the frame", () => {
  const [circle] = annotation(cm.circle, {x: 5, r: 3}, {selector: "circle"});
  assert.deepStrictEqual(attributes(circle, "cx", "cy"), [100, 100]);
});

test("cm.annotate takes its own data, with positions in data units", () => {
  const notes = [
    {x: 0, y: 50, note: "a"},
    {x: 10, y: 100, note: "b"},
  ];
  const texts = annotation(
    cm.text,
    {data: notes, x: (d) => d.x, y: (d) => d.y, text: (d) => d.note},
    {selector: "text"},
  );
  assert.deepStrictEqual(
    texts.map((t) => [...attributes(t, "x", "y"), t.textContent]),
    [
      [0, 100, "a"],
      [200, 0, "b"],
    ],
  );
});

test("cm.annotate places points at an angle and a radius in polar, and spans the radius for links", () => {
  const [circle] = annotation(cm.circle, {x: 2.5, y: 100, r: 3}, {coordinate: cm.polar, selector: "circle"});
  // A quarter turn, at the outer radius: to the right of the center.
  const [cx, cy] = attributes(circle, "cx", "cy");
  assert.ok(Math.abs(cx - 200) < 1e-6 && Math.abs(cy - 100) < 1e-6);
  const [line] = annotation(cm.link, {x: 0}, {coordinate: cm.polar, selector: "line"});
  // A spoke at 12 o'clock, from the center to the outer radius.
  assert.deepStrictEqual(attributes(line, "x1", "y1", "x2", "y2"), [100, 100, 100, 0]);
});

// Renders a column chart of A and B on a 200 × 200 frame with an annotation.
function bandAnnotation(shape, options) {
  const renderer = cm.svg({width: 200, height: 200});
  const root = cm.flow().renderer(renderer);
  root
    .data([
      {k: "A", v: 1},
      {k: "B", v: 2},
    ])
    .transform(cm.encode, {x: "k", y: "v"})
    .transform(cm.spreadX)
    .transform(cm.plane, {margin: 0})
    .add(cm.annotate(shape), options);
  root.render();
  return renderer;
}

test("cm.annotate(cm.rect) covers whole bands, and cm.link stays at their middle", () => {
  const band = d3.scaleBand(["A", "B"], [0, 200]).padding(0.1);
  const one = bandAnnotation(cm.rect, {x: "A"}).node().querySelector("rect");
  assertInDelta(+one.getAttribute("x"), band("A"));
  assertInDelta(+one.getAttribute("width"), band.bandwidth());
  const two = bandAnnotation(cm.rect, {x: "B", x1: "A"}).node().querySelector("rect");
  assertInDelta(+two.getAttribute("x"), band("A"));
  assertInDelta(+two.getAttribute("width"), band("B") + band.bandwidth() - band("A"));
  const line = bandAnnotation(cm.link, {x: "A"}).node().querySelector("line");
  assertInDelta(+line.getAttribute("x1"), band("A") + band.bandwidth() / 2);
});

test("cm.annotate in polar uses a given angle or radius at both ends, like in a plane", () => {
  const renderer = cm.svg({width: 200, height: 200});
  const root = cm.flow().renderer(renderer);
  const flow = root
    .data([
      {x: 0, y: 0},
      {x: 10, y: 100},
    ])
    .transform(cm.encode, {x: "x", y: "y"})
    .transform(cm.polar, {margin: 0, innerRadius: 0.5, y: {type: "linear"}});
  flow.add(cm.annotate(cm.link), {x1: 0});
  flow.add(cm.annotate(cm.circle), {x: 0, y1: 100, r: 2});
  root.render();
  const [line] = renderer.node().querySelectorAll("line");
  // A spoke at 12 o'clock, from the hole to the rim, as with {x: 0}.
  assert.deepStrictEqual(attributes(line, "x1", "y1", "x2", "y2"), [100, 50, 100, 0]);
  const [circle] = renderer.node().querySelectorAll("circle");
  assert.deepStrictEqual(attributes(circle, "cx", "cy"), [100, 0]);
});

test("cm.annotate(cm.rect) covers a whole flex band, as wide as its category", () => {
  const renderer = cm.svg({width: 200, height: 200});
  const root = cm.flow().renderer(renderer);
  root
    .data([
      {k: "a", n: 1},
      {k: "b", n: 3},
    ])
    .transform(cm.encode, {x: "k", n: "n"})
    .transform(cm.spreadX, {flex: "n", padding: 0})
    .transform(cm.plane, {margin: 0})
    .add(cm.annotate(cm.rect), {x: "b"});
  root.render();
  const [rect] = renderer.node().querySelectorAll("rect");
  assert.deepStrictEqual(attributes(rect, "x", "width"), [50, 150]);
});

test("cm.annotate transforms its positions with the transform or percent of their scale", () => {
  const renderer = cm.svg({width: 200, height: 200});
  const root = cm.flow().renderer(renderer);
  root
    .data([
      {x: 0, y: 0},
      {x: 10, y: 1},
    ])
    .transform(cm.encode, {x: "x", y: "y"})
    .transform(cm.plane, {margin: 0, x: {axis: null}, y: {axis: null, percent: true}})
    .add(cm.annotate(cm.link), {y: 0.5});
  root.render();
  const [line] = renderer.node().querySelectorAll("line");
  // 0.5 is 50%, in the middle of the frame.
  assert.deepStrictEqual(attributes(line, "x1", "y1", "x2", "y2"), [0, 100, 200, 100]);
});

test("cm.annotate transforms its radii in polar with the transform of their scale", () => {
  const [circle] = annotation(cm.circle, {x: 0, y: 50, r: 3}, {coordinate: cm.polar, selector: "circle"});
  const renderer = cm.svg({width: 200, height: 200});
  const root = cm.flow().renderer(renderer);
  root
    .data([
      {x: 0, y: 0},
      {x: 10, y: 1},
    ])
    .transform(cm.encode, {x: "x", y: "y"})
    .transform(cm.polar, {margin: 0, x: {axis: null}, y: {axis: null, type: "linear", transform: (d) => d * 100}})
    .add(cm.annotate(cm.circle), {x: 0, y: 0.5, r: 3});
  root.render();
  // A radius of 0.5 is 50 once transformed, as in the chart of y in [0, 100].
  const [transformed] = renderer.node().querySelectorAll("circle");
  assert.deepStrictEqual(attributes(transformed, "cx", "cy"), attributes(circle, "cx", "cy"));
});

test("cm.annotate reads strings of channels as fields of its data, and as constants without data", () => {
  const notes = [
    {at: 0, value: 50, note: "a"},
    {at: 10, value: 100, note: "b"},
  ];
  const texts = annotation(cm.text, {data: notes, x: "at", y: "value", text: "note"}, {selector: "text"});
  assert.deepStrictEqual(
    texts.map((t) => [...attributes(t, "x", "y"), t.textContent]),
    [
      [0, 100, "a"],
      [200, 0, "b"],
    ],
  );
  // Without data, there are no fields: the text is as given.
  const [label] = annotation(cm.text, {x: 5, y: 50, text: "note"}, {selector: "text"});
  assert.strictEqual(label.textContent, "note");
});
