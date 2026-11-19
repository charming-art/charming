import assert from "node:assert";
import {test} from "vitest";
import "../../install-canvas-mock.js";
import * as cm from "../../../src/index.js";
import {probe} from "../../helpers.js";

test("flow.transform(transform, ...params) replaces the bound values with the result of transform", () => {
  const [shape, calls] = probe();
  const root = cm.flow().renderer(cm.canvas({width: 100, height: 100, dpi: 1}));
  root
    .data([1, 2])
    .transform(cm.bind, {x: (d) => d})
    .transform((flow, data, k) => data.map((d) => ({...d, value: {x: d.value.x.map((x) => x * k)}})), 10)
    .append(shape);
  root.render();
  assert.deepStrictEqual(calls[0].x, [10, 20]);
});

test("flow.transform(transform) returns a new flow", () => {
  const flow = cm.flow().data([1]).transform(cm.bind, {});
  const transformed = flow.transform((_, data) => data);
  assert.notStrictEqual(transformed, flow);
  assert.deepStrictEqual(transformed.data(), flow.data());
});

test("flow.transform(transform) uses the rows of the returned contexts for later transforms and shapes", () => {
  const [shape, calls] = probe();
  const root = cm.flow().renderer(cm.canvas({width: 100, height: 100, dpi: 1}));
  // Returns one row per letter of each word.
  const letters = (_, data) =>
    data.map(({group}) => {
      const rows = group.flatMap((word) => Array.from(word));
      return {I: rows.map((_, i) => i), group: rows, value: {}};
    });
  root
    .data(["ab", "c"])
    .transform(cm.bind, {})
    .transform(letters)
    .transform(cm.bind, {x: (d, i) => `${d}${i}`})
    .append(shape, {datum: (d) => d.datum});
  root.render();
  assert.deepStrictEqual(calls[0].x, ["a0", "b1", "c2"]);
  assert.deepStrictEqual(calls[0].datum, ["a", "b", "c"]);
});

test("flow.transform(transform) keeps the rows of contexts that keep their group", () => {
  const [shape, calls] = probe();
  const root = cm.flow().renderer(cm.canvas({width: 100, height: 100, dpi: 1}));
  root
    .data([1, 2])
    .transform(cm.bind, {x: (d) => d})
    .transform((_, data) => data.map((d) => ({...d, value: {x: d.value.x.map((x) => x * 10)}})))
    .append(shape, {datum: (d) => d.datum});
  root.render();
  assert.deepStrictEqual(calls[0].x, [10, 20]);
  assert.deepStrictEqual(calls[0].datum, [1, 2]);
});

// A composite shape that records its name and options when drawn.
function recorder(name, drawn) {
  const shape = (flow, value, {options}) => drawn.push([name, options]);
  shape.raw = true;
  return shape;
}

test("flow.transform(transform) adds the marks of transform.marks, given its params, after it and before later shapes", () => {
  const drawn = [];
  const root = cm.flow().renderer(cm.canvas({width: 100, height: 100, dpi: 1}));
  const transform = (_, data) => data;
  transform.marks = (k) => [[recorder("mark", drawn), {k}]];
  root
    .data([1, 2])
    .transform(cm.bind, {x: (d) => d})
    .transform(transform, 3)
    .append(recorder("later", drawn));
  root.render();
  // The options are as given: what a mark means, such as an implicit guide, is up to the transform.
  assert.deepStrictEqual(drawn, [
    ["mark", {k: 3}],
    ["later", {}],
  ]);
});

test("flow.transform(transform) adds the marks of transform.marks as it's built, whatever the transform returns", () => {
  let marked = 0;
  const transform = () => null;
  transform.marks = () => (marked++, [[recorder("mark", []), {}]]);
  const flow = cm.flow().data([1]).transform(transform);
  // The marks are known before the transform runs.
  assert.strictEqual(marked, 1);
  assert.strictEqual(flow._values, null);
});

test("flow.transform(transform) draws the marks of transform.marks marked front after later shapes", () => {
  const drawn = [];
  const root = cm.flow().renderer(cm.canvas({width: 100, height: 100, dpi: 1}));
  const transform = (_, data) => data;
  // Builtin shapes, which record as they're drawn.
  const shape = (name) => Object.assign(() => drawn.push([name]), {builtin: true});
  transform.marks = () => [
    [shape("under"), {}],
    [shape("front"), {}, {front: true}],
  ];
  root
    .data([1])
    .transform(cm.bind, {x: (d) => d})
    .transform(transform)
    .append(shape("later"));
  root.render();
  assert.deepStrictEqual(
    drawn.map(([name]) => name),
    ["under", "later", "front"],
  );
});
