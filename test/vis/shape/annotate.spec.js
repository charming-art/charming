import assert from "node:assert";
import {test} from "vitest";
import * as cm from "../../../src/index.js";

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
    .transform(coordinate, {margin: 0, ...(coordinate === cm.polar && {typeY: "linear"})})
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
