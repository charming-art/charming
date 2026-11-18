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

test("flow.transform(transform) adds the marks of transform.marks after it, marked implicit, before later shapes", () => {
  const drawn = [];
  const root = cm.flow().renderer(cm.canvas({width: 100, height: 100, dpi: 1}));
  const transform = (_, data) => data;
  transform.marks = (values, k) => [[recorder("implicit", drawn), {k, n: values.length}]];
  root
    .data([1, 2])
    .transform(cm.bind, {x: (d) => d})
    .transform(transform, 3)
    .append(recorder("later", drawn));
  root.render();
  assert.deepStrictEqual(drawn, [
    ["implicit", {k: 3, n: 1, implicit: true}],
    ["later", {}],
  ]);
});

test("flow.transform(transform) adds no marks without bound values", () => {
  const drawn = [];
  const root = cm.flow().renderer(cm.canvas({width: 100, height: 100, dpi: 1}));
  const transform = (_, data) => data;
  transform.marks = () => [[recorder("implicit", drawn), {}]];
  root.data([1]).transform(transform).append(recorder("later", drawn));
  root.render();
  assert.deepStrictEqual(drawn, [["later", {}]]);
});

test("flow.transform(transform) draws the marks of transform.marks marked front after later shapes", () => {
  const drawn = [];
  const root = cm.flow().renderer(cm.canvas({width: 100, height: 100, dpi: 1}));
  const transform = (_, data) => data;
  transform.marks = () => [
    [recorder("under", drawn), {}],
    [recorder("front", drawn), {}, {front: true}],
  ];
  root
    .data([1])
    .transform(cm.bind, {x: (d) => d})
    .transform(transform)
    .append(recorder("later", drawn));
  root.render();
  assert.deepStrictEqual(
    drawn.map(([name]) => name),
    ["under", "later", "front"],
  );
});
