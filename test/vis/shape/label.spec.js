import assert from "node:assert";
import {test, vi} from "vitest";
import "../../install-canvas-mock.js";
import * as cm from "../../../src/index.js";

// Labels a bar of a 100 × 100 plane without margins, from x 0 to 40 and y 20 to 60 (y up), and returns
// the attributes of its texts.
function labels(options, channels = {}) {
  const renderer = cm.svg({width: 100, height: 100});
  const root = cm.flow().renderer(renderer);
  root
    .data([{v: 0}])
    .transform(cm.bind, {x: 0, x1: 40, y: 80, y1: 40, fill: "steelblue", ...channels})
    .append(cm.label, {text: "a", ...options});
  root.render();
  return Array.from(renderer.node().querySelectorAll("text"), (t) => {
    const attributes = {};
    for (const {name, value} of t.attributes) attributes[name] = isNaN(value) ? value : +value;
    return attributes;
  });
}

const at = (options, channels) => {
  const [t] = labels(options, channels);
  return [t.x, t.y, t["text-anchor"] ?? "start", t["dominant-baseline"] ?? "alphabetic"];
};

test("cm.label centers a text in the box of its row by default, with the font of the axes", () => {
  const [t] = labels({});
  assert.deepStrictEqual([t.x, t.y, t["text-anchor"], t["dominant-baseline"]], [20, 60, "middle", "central"]);
  assert.deepStrictEqual([t.fill, t["font-size"], t["font-family"]], ["currentColor", 10, "system-ui, sans-serif"]);
});

test("cm.label places a text inside an edge of the box, padding inward, aligned toward the inside", () => {
  assert.deepStrictEqual(at({position: "inside-right"}), [36, 60, "end", "central"]);
  assert.deepStrictEqual(at({position: "inside-left"}), [4, 60, "start", "central"]);
  assert.deepStrictEqual(at({position: "inside-top"}), [20, 44, "middle", "text-before-edge"]);
  assert.deepStrictEqual(at({position: "inside-bottom"}), [20, 76, "middle", "text-after-edge"]);
  assert.deepStrictEqual(at({position: "inside-top-left"}), [4, 44, "start", "text-before-edge"]);
  assert.deepStrictEqual(at({position: "inside-bottom-right"}), [36, 76, "end", "text-after-edge"]);
});

test("cm.label places a text outside an edge of the box, padding outward, aligned away from it", () => {
  assert.deepStrictEqual(at({position: "right"}), [44, 60, "start", "central"]);
  assert.deepStrictEqual(at({position: "left"}), [-4, 60, "end", "central"]);
  assert.deepStrictEqual(at({position: "top"}), [20, 36, "middle", "text-after-edge"]);
  assert.deepStrictEqual(at({position: "bottom"}), [20, 84, "middle", "text-before-edge"]);
  assert.deepStrictEqual(at({position: "top-right"}), [44, 36, "start", "text-after-edge"]);
  assert.deepStrictEqual(at({position: "bottom-left"}), [-4, 84, "end", "text-before-edge"]);
});

test("cm.label takes padding, dx and dy, and an unknown position is the center", () => {
  assert.deepStrictEqual(at({position: "right", padding: 10}), [50, 60, "start", "central"]);
  assert.deepStrictEqual(at({position: "right", dx: 2, dy: -3}), [46, 57, "start", "central"]);
  assert.deepStrictEqual(at({position: "nowhere"}), [20, 60, "middle", "central"]);
});

test("cm.label takes a box of zero size for a position without its pair, such as a dot", () => {
  assert.deepStrictEqual(at({position: "top"}, {x1: undefined, y1: undefined}), [0, 76, "middle", "text-after-edge"]);
});

test("cm.label takes its options per row, such as a position that flips sides with the data", () => {
  const renderer = cm.svg({width: 100, height: 100});
  const root = cm.flow().renderer(renderer);
  root
    .data([{v: 10}, {v: -10}])
    .transform(cm.bind, {x: 50, x1: (d) => 50 + d.v, y: 50})
    .append(cm.label, {text: "a", position: (d) => (d.datum.v > 0 ? "left" : "right"), dy: (d, i) => i});
  root.render();
  const T = Array.from(renderer.node().querySelectorAll("text"), (t) => [+t.getAttribute("x"), +t.getAttribute("y")]);
  assert.deepStrictEqual(T, [
    [46, 50],
    [54, 51],
  ]);
});

test("cm.label doesn't inherit the colors of the mark it labels, unless given its own", () => {
  const [inherited] = labels({}, {stroke: "red", fillOpacity: 0.5});
  assert.deepStrictEqual(
    [inherited.fill, inherited.stroke, inherited["fill-opacity"]],
    ["currentColor", undefined, undefined],
  );
  const [own] = labels({fill: "white", fillOpacity: 0.8});
  assert.deepStrictEqual([own.fill, own["fill-opacity"]], ["white", 0.8]);
});

test("cm.label with contrast fills black or white, whichever contrasts more with the mark's fill", () => {
  assert.strictEqual(labels({contrast: true}, {fill: "#08306b"})[0].fill, "white");
  assert.strictEqual(labels({contrast: true}, {fill: "#fff5eb"})[0].fill, "black");
  // A fill given explicitly wins.
  assert.strictEqual(labels({contrast: true, fill: "red"}, {fill: "#08306b"})[0].fill, "red");
});

test("cm.label with halo paints a stroke under its fill, white by default, or of a given color and width", () => {
  const [white] = labels({halo: true});
  assert.deepStrictEqual([white.stroke, white["stroke-width"], white["paint-order"]], ["white", 3, "stroke"]);
  const [black] = labels({halo: "black", haloWidth: 5});
  assert.deepStrictEqual([black.stroke, black["stroke-width"], black.fill], ["black", 5, "currentColor"]);
});

test("cm.label takes the alignment, font and format given, over the position's", () => {
  const [t] = labels({
    position: "right",
    textAlign: "end",
    fontSize: 12,
    fontWeight: "bold",
    text: 0.25,
    format: ".0%",
  });
  assert.deepStrictEqual([t["text-anchor"], t["font-size"], t["font-weight"]], ["end", 12, "bold"]);
  const renderer = cm.svg({width: 100, height: 100});
  const root = cm.flow().renderer(renderer);
  root.data([0.25]).append(cm.label, {x: 0, y: 0, text: (d) => d, format: ".0%"});
  root.render();
  assert.strictEqual(renderer.node().querySelector("text").textContent, "25%");
});

test("cm.label places labels on the wedges of cm.polar: center, inside or outside the outer radius", () => {
  const draw = (options) => {
    const renderer = cm.svg({width: 200, height: 200});
    const root = cm.flow().renderer(renderer);
    root
      .data([{v: 1}, {v: 1}])
      .transform(cm.encode, {x: "v"})
      .transform(cm.stackX)
      .transform(cm.polar, {margin: 0, innerRadius: 0.5})
      .add(cm.label, {text: "a", ...options});
    root.render();
    return Array.from(renderer.node().querySelectorAll("text"), (t) => [
      Math.round(+t.getAttribute("x")),
      Math.round(+t.getAttribute("y")),
      t.getAttribute("text-anchor"),
    ]);
  };
  // Two halves: the first from 12 to 6 o'clock, its middle at 3 o'clock, at radius 75.
  assert.deepStrictEqual(draw(), [
    [175, 100, "middle"],
    [25, 100, "middle"],
  ]);
  assert.deepStrictEqual(draw({position: "outside"}), [
    [104 + 100, 100, "start"],
    [-4, 100, "end"],
  ]);
  assert.deepStrictEqual(draw({position: "inside"}), [
    [196, 100, "end"],
    [4, 100, "start"],
  ]);
  assert.deepStrictEqual(draw({position: "top"}), draw());
});

test("cm.label moves with its bar between keyframes, by key", () => {
  vi.useFakeTimers();
  const renderer = cm.svg({width: 100, height: 100});
  const root = cm.flow({transition: {duration: 160, ease: "linear"}}).renderer(renderer);
  const draw = (x1) => {
    root
      .data([{k: "a"}])
      .transform(cm.bind, {x: 0, x1, y: 40, y1: 60})
      .append(cm.label, {text: "a", position: "right", key: "a"});
    root.render();
  };
  draw(20);
  draw(60);
  vi.advanceTimersByTime(80);
  const x = +renderer.node().querySelector("text").getAttribute("x");
  vi.useRealTimers();
  assert.strictEqual(x, 44);
});

test("cm.label is a point along a position set in its options without its pair, like cm.text", () => {
  // x is given, so the label sits at x 20 rather than in the middle of the box from 20 to 40.
  assert.deepStrictEqual(at({x: 20}), [20, 60, "middle", "central"]);
  assert.deepStrictEqual(at({x: 20, position: "right"}), [24, 60, "start", "central"]);
  // Both of a pair given span the box.
  assert.deepStrictEqual(at({x: 10, x1: 30}), [20, 60, "middle", "central"]);
});
