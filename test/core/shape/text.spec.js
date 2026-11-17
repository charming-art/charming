import assert from "node:assert";
import {test, vi} from "vitest";
import * as cm from "../../../src/index.js";

// Renders texts with SVG and returns their x, y, text-anchor and dominant-baseline.
function texts(data, options) {
  const renderer = cm.svg({width: 100, height: 100});
  const root = cm.flow().renderer(renderer);
  root.data(data).append(cm.text, {text: "a", ...options});
  root.render();
  return Array.from(renderer.node().querySelectorAll("text"), (t) => [
    +t.getAttribute("x"),
    +t.getAttribute("y"),
    t.getAttribute("text-anchor"),
    t.getAttribute("dominant-baseline"),
  ]);
}

test("cm.text draws texts at x and y", () => {
  assert.deepStrictEqual(texts([1], {x: 10, y: 20}), [[10, 20, null, null]]);
});

test("cm.text centers a text in the box from x to x1 and y to y1, in either order", () => {
  assert.deepStrictEqual(texts([1], {x: 10, x1: 30, y: 20, y1: 60}), [[20, 40, "middle", "central"]]);
  assert.deepStrictEqual(texts([1], {x: 30, x1: 10, y: 60, y1: 20}), [[20, 40, "middle", "central"]]);
});

test("cm.text keeps the alignment given in a box", () => {
  const options = {x: 10, x1: 30, y: 20, y1: 60, textAlign: "start", textBaseline: "top"};
  assert.deepStrictEqual(texts([1], options), [[20, 40, "start", "text-before-edge"]]);
});

test("cm.text spans a box along one position, aligned along it", () => {
  assert.deepStrictEqual(texts([1], {x: 10, x1: 30, y: 50}), [[20, 50, "middle", null]]);
  assert.deepStrictEqual(texts([1], {x: 50, y: 20, y1: 60}), [[50, 40, null, "central"]]);
});

test("cm.text is a point along a position set without its pair, even with the other bound", () => {
  const renderer = cm.svg({width: 100, height: 100});
  const root = cm.flow().renderer(renderer);
  root
    .data([{low: 10, high: 30, mid: 50}])
    .transform(cm.bind, {x: () => 20, y: (d) => d.high, y1: (d) => d.low, v: (d) => d.mid})
    .append(cm.text, {y: "v", text: "a"});
  root.render();
  const t = renderer.node().querySelector("text");
  assert.deepStrictEqual([+t.getAttribute("x"), +t.getAttribute("y")], [20, 50]);
});

test("cm.text and cm.circle are points along a position whose pair has no anchor", () => {
  assert.deepStrictEqual(texts([1], {x: 10, y1: 30}), [[10, 0, null, null]]);
  assert.deepStrictEqual(texts([1], {x1: 30, y: 10}), [[0, 10, null, null]]);
  const renderer = cm.svg({width: 100, height: 100});
  const root = cm.flow().renderer(renderer);
  root.data([1]).append(cm.circle, {x1: 30, y: 10, r: 2});
  root.render();
  assert.strictEqual(+renderer.node().querySelector("circle").getAttribute("cy"), 10);
});

test("cm.text centers in a band bound by transforms, such as a column from spreadX, unless y is set", () => {
  const draw = (options) => {
    const renderer = cm.svg({width: 200, height: 200});
    const root = cm.flow().renderer(renderer);
    root
      .data([{k: "A", v: 10}])
      .transform(cm.encode, {x: "k", y: "v"})
      .transform(cm.spreadX)
      .transform(cm.plane, {margin: 0, scales: {y: {domain: [0, 10]}}})
      .append(cm.text, {text: "A", ...options});
    root.render();
    const t = renderer.node().querySelector("text");
    return [+t.getAttribute("x"), +t.getAttribute("y"), t.getAttribute("dominant-baseline")];
  };
  // The column spans the band in x and from 0 to 10 in y: the label sits in its middle.
  assert.deepStrictEqual(draw(), [100, 100, "central"]);
  // Setting y without y1 keeps the label at the top of the column.
  assert.deepStrictEqual(draw({y: "y"}), [100, 0, null]);
});

test("cm.text formats its text with a d3 number format, or a function", () => {
  const draw = (format) => {
    const renderer = cm.svg({width: 100, height: 100});
    const root = cm.flow().renderer(renderer);
    root.data([1234.5, 0.25]).append(cm.text, {x: 0, y: 0, text: (d) => d, format});
    root.render();
    return Array.from(renderer.node().querySelectorAll("text"), (t) => t.textContent);
  };
  assert.deepStrictEqual(draw(",d"), ["1,235", "0"]);
  assert.deepStrictEqual(draw(".0%"), ["123450%", "25%"]);
  assert.deepStrictEqual(
    draw((d) => `#${d}`),
    ["#1234.5", "#0.25"],
  );
});

test("cm.text with a string format interpolates numeric texts in transitions", () => {
  vi.useFakeTimers();
  const renderer = cm.svg({width: 100, height: 100});
  const root = cm.flow({transition: {duration: 160, ease: "linear"}}).renderer(renderer);
  const draw = (v) => {
    root.data([v]).append(cm.text, {x: 0, y: 0, text: (d) => d, format: ",d", key: "a"});
    root.render();
  };
  draw(0);
  draw(2000);
  vi.advanceTimersByTime(80);
  const text = renderer.node().querySelector("text").textContent;
  vi.useRealTimers();
  assert.strictEqual(text, "1,000");
});

test("cm.text takes a string format as a d3 format, even if a channel has its name", () => {
  const renderer = cm.svg({width: 100, height: 100});
  const root = cm.flow().renderer(renderer);
  root
    .data([255])
    .transform(cm.bind, {x: () => "Jan", y: 0})
    .append(cm.text, {text: (d) => d.datum, format: "x"});
  root.render();
  assert.strictEqual(renderer.node().querySelector("text").textContent, "ff");
});
