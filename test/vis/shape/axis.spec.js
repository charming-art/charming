import assert from "node:assert";
import {test} from "vitest";
import * as cm from "../../../src/index.js";
import {assertInDelta} from "../../helpers.js";

const data = [
  {letter: "A", frequency: 0.08},
  {letter: "B", frequency: 0.01},
];

// Renders the chart with SVG and returns the text of its labels.
function texts(options) {
  const renderer = cm.svg({width: 640, height: 400});
  const root = cm.flow().renderer(renderer);
  root
    .data(data)
    .transform(cm.encode, {x: "letter", y: "frequency"})
    .transform(cm.spreadX)
    .transform(cm.plane)
    .add(cm.axis, options);
  root.render();
  return Array.from(renderer.node().querySelectorAll("text"), (d) => d.textContent);
}

test("cm.axis draws both axes with their labels", () => {
  const T = texts();
  assert.ok(T.includes("A") && T.includes("letter"));
  assert.ok(T.includes("0.08") && T.includes("↑ frequency"));
});

test("cm.axis skips an axis set to false", () => {
  assert.deepStrictEqual(texts({x: false, y: false}), []);
  const T = texts({y: false});
  assert.ok(T.includes("letter"));
  assert.ok(!T.includes("↑ frequency"));
});

test("cm.axis passes the options of x and y to each axis, and the other options to both", () => {
  const T = texts({tickFormat: (d) => `[${d}]`, x: {label: "Letter"}, y: {label: null}});
  assert.ok(T.includes("[A]") && T.includes("[0.08]"));
  assert.ok(T.includes("Letter"));
  assert.ok(!T.some((d) => d.includes("frequency")));
});

test("cm.axis formats ticks for the count of ticks given", () => {
  const renderer = cm.svg({width: 640, height: 400});
  const root = cm.flow().renderer(renderer);
  root
    .data([0, 1])
    .transform(cm.encode, {x: (d) => d, y: (d) => d})
    .transform(cm.plane)
    .add(cm.axisY, {ticks: 20, label: null});
  root.render();
  const T = Array.from(renderer.node().querySelectorAll("text"), (d) => d.textContent);
  assert.strictEqual(T.length, 21);
  assert.ok(T.includes("0.05"));
  assert.strictEqual(new Set(T).size, T.length);
});

// Renders a rose with cm.polar and returns the text of the radius labels: the halos come first.
function polarTexts(axisOptions) {
  const renderer = cm.svg({width: 200, height: 200});
  const root = cm.flow().renderer(renderer);
  root
    .data([
      {name: "a", value: 10},
      {name: "b", value: 4},
    ])
    .transform(cm.encode, {x: "name", y: "value"})
    .transform(cm.spreadX)
    .transform(cm.polar)
    .add(cm.axisY, axisOptions);
  root.render();
  const T = Array.from(renderer.node().querySelectorAll("text"), (d) => d.textContent);
  return T.slice(T.length / 2);
}

test("cm.axisY in polar skips only the tick at the baseline", () => {
  assert.deepStrictEqual(polarTexts({ticks: [5, 10]}), ["5", "10"]);
  assert.deepStrictEqual(polarTexts({ticks: [0, 5]}), ["5"]);
});

test("cm.axis rotates tick labels by tickRotate degrees, aligned to their ticks", () => {
  const renderer = cm.svg({width: 640, height: 400});
  const root = cm.flow().renderer(renderer);
  root
    .data(data)
    .transform(cm.encode, {x: "letter", y: "frequency"})
    .transform(cm.spreadX)
    .transform(cm.plane)
    .add(cm.axis, {x: {tickRotate: -45}, y: {tickRotate: -90}});
  root.render();
  const [a] = Array.from(renderer.node().querySelectorAll("text")).filter((t) => t.textContent === "A");
  assert.match(a.getAttribute("transform"), /^rotate\(-45,/);
  assert.strictEqual(a.getAttribute("text-anchor"), "end");
  const tick = Array.from(renderer.node().querySelectorAll("text")).find((t) => t.textContent === "0.08");
  assert.match(tick.getAttribute("transform"), /^rotate\(-90,/);
  assert.strictEqual(tick.getAttribute("text-anchor"), "middle");
  assert.strictEqual(tick.getAttribute("dominant-baseline"), "text-after-edge");
});

// The tick labels of a column chart of letters, with options for its axes.
function rotated(options) {
  const renderer = cm.svg({width: 640, height: 400});
  const root = cm.flow().renderer(renderer);
  root
    .data(data)
    .transform(cm.encode, {x: "letter", y: "frequency"})
    .transform(cm.spreadX)
    .transform(cm.plane)
    .add(cm.axis, options);
  root.render();
  const find = (text) => Array.from(renderer.node().querySelectorAll("text")).find((t) => t.textContent === text);
  return find;
}

test("cm.axisX centers tick labels rotated by 10° or more on their tick, like Plot, with more padding", () => {
  const a = rotated({x: {tickRotate: -45}})("A");
  assert.strictEqual(a.getAttribute("text-anchor"), "end");
  assert.strictEqual(a.getAttribute("dominant-baseline"), "central");
  // The bottom of the chart is at 370; the tick is 6px and the padding 3px plus 4·cos 45°.
  assertInDelta(+a.getAttribute("y"), 370 + 6 + 3 + 4 * Math.cos(Math.PI / 4));
});

test("cm.axisX turns tick labels rotated by less than 10° around their center, like Plot", () => {
  const a = rotated({x: {tickRotate: -5}})("A");
  assert.strictEqual(a.getAttribute("text-anchor"), "middle");
  assert.strictEqual(a.getAttribute("dominant-baseline"), "text-before-edge");
  assert.strictEqual(+a.getAttribute("y"), 370 + 6 + 3);
});

test("cm.axisY pads steep tick labels by 4·cos θ, like Plot", () => {
  const find = rotated({y: {tickRotate: -70}});
  assertInDelta(+find("0.08").getAttribute("x"), 40 - 6 - 3 - 4 * Math.cos((70 * Math.PI) / 180));
  const upright = rotated({y: {tickRotate: -90}})("0.08");
  assertInDelta(+upright.getAttribute("x"), 40 - 6 - 3);
});
