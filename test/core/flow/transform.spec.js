import assert from "node:assert";
import {test} from "vitest";
import "../../install-canvas-mock.js";
import * as cm from "../../../src/index.js";
import {probe} from "../../helpers.js";

test("flow.transform(transform, ...params) replaces the appended values with the result of transform", () => {
  const [shape, calls] = probe();
  const root = cm.flow().renderer(cm.canvas({width: 100, height: 100, dpi: 1}));
  root
    .data([1, 2])
    .append(shape, {x: (d) => d})
    .transform((flow, data, k) => data.map((d) => ({...d, value: {x: d.value.x.map((x) => x * k)}})), 10);
  root.render();
  assert.deepStrictEqual(calls[0].x, [10, 20]);
});

test("flow.transform(transform) returns a new flow", () => {
  const flow = cm.flow().data([1]).append(probe()[0], {});
  const transformed = flow.transform((_, data) => data);
  assert.notStrictEqual(transformed, flow);
  assert.deepStrictEqual(transformed.data(), flow.data());
});
