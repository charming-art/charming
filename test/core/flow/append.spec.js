import assert from "node:assert";
import {test} from "vitest";
import "../../install-canvas-mock.js";
import * as cm from "../../../src/index.js";
import {probe} from "../../helpers.js";

function render(build) {
  const root = cm.flow().renderer(cm.canvas({width: 100, height: 100, dpi: 1}));
  build(root);
  root.render();
}

test("flow.append(shape, options) evaluates constant options for each datum", () => {
  const [shape, calls] = probe();
  render((root) => root.data([1, 2, 3]).append(shape, {fill: "red"}));
  assert.deepStrictEqual(calls[0].fill, ["red", "red", "red"]);
});

test("flow.append(shape, options) evaluates function options with the datum and index", () => {
  const [shape, calls] = probe();
  render((root) => root.data([1, 2, 3]).append(shape, {x: (d, i) => d * 10 + i}));
  assert.deepStrictEqual(calls[0].x, [10, 21, 32]);
});

test("flow.append(shape, options) looks up array options by index", () => {
  const [shape, calls] = probe();
  render((root) => root.data(["a", "b"]).append(shape, {y: [5, 6]}));
  assert.deepStrictEqual(calls[0].y, [5, 6]);
});

test("flow.append(shape, options) returns a new flow whose appended shapes are drawn once per datum", () => {
  const [child, calls] = probe();
  render((root) =>
    root
      .data([1, 2])
      .append(cm.g, {})
      .append(child, {v: (d) => d}),
  );
  assert.deepStrictEqual(
    calls.map((d) => d.v),
    [[1], [2]],
  );
});

test("flow.append(shape, options) accepts null options", () => {
  const [shape, calls] = probe();
  render((root) => root.data([1, 2]).append(shape, {fill: null}));
  assert.deepStrictEqual(calls[0].fill, [null, null]);
});

test("flow.append(shape) works without options", () => {
  const [shape, calls] = probe();
  render((root) => root.data([1, 2]).append(shape));
  assert.deepStrictEqual(calls, [{}]);
});

test("flow.append(shape, options) passes composite shapes the context of the flow and the options", () => {
  const calls = [];
  const shape = (flow, value, context) => calls.push(context);
  render((root) =>
    root
      .data([1, 2])
      .transform(cm.bind, {x: (d) => d})
      .transform((_, data) => data.map((d) => ({...d, scales: {x: "a scale"}})))
      .append(shape, {fill: "red"}),
  );
  assert.deepStrictEqual(calls[0].scales, {x: "a scale"});
  assert.deepStrictEqual(calls[0].options, {fill: "red"});
});

test("flow.append(shape, options) passes the options of a raw shape as they are", () => {
  const calls = [];
  const format = (d) => `${d}%`;
  const shape = (flow, value, {options}) => calls.push([value, options]);
  shape.raw = true;
  render((root) =>
    root
      .data([1, 2])
      .transform(cm.bind, {x: (d) => d})
      .append(shape, {grid: true, tickFormat: format}),
  );
  const [[value, options]] = calls;
  assert.deepStrictEqual(value, {x: [1, 2]});
  assert.strictEqual(options.grid, true);
  assert.strictEqual(options.tickFormat, format);
});

test("flow.append(shape, options) takes the values of a bound channel named by a string", () => {
  const [shape, calls] = probe();
  render((root) =>
    root
      .data([1, 2])
      .transform(cm.bind, {x: (d) => d, v2: (d) => d * 10})
      .append(shape, {y: "v2", fill: "red", text: "toString"}),
  );
  assert.deepStrictEqual(calls[0].y, [10, 20]);
  // Other strings are constants, even the names of inherited properties.
  assert.deepStrictEqual(calls[0].fill, ["red", "red"]);
  assert.deepStrictEqual(calls[0].text, ["toString", "toString"]);
});

test("flow.append(shape, options) returns a literal that names a channel from a function", () => {
  const [shape, calls] = probe();
  render((root) =>
    root
      .data([1, 2])
      .transform(cm.bind, {x: (d) => d})
      .append(shape, {text: () => "x"}),
  );
  assert.deepStrictEqual(calls[0].text, ["x", "x"]);
});

test("flow.append(shape, options) keeps a color for fill and stroke, even if a channel has its name", () => {
  const [shape, calls] = probe();
  render((root) =>
    root
      .data([5])
      .transform(cm.bind, {x: (d) => d, red: (d) => d})
      .append(shape, {fill: "red", stroke: "red", y: "red"}),
  );
  assert.deepStrictEqual(calls[0].fill, ["red"]);
  assert.deepStrictEqual(calls[0].stroke, ["red"]);
  assert.deepStrictEqual(calls[0].y, [5]);
});

test("flow.append(shape, options) flattens enter and exit states into channels, evaluated per row", () => {
  const [context] = cm
    .flow()
    .data([1, 2])
    .transform(cm.bind, {x: (d) => d, enter: {y: (d) => d * 10, delay: 5}, exit: {fillOpacity: 0}})._values;
  assert.deepStrictEqual(context.value.enterY, [10, 20]);
  assert.deepStrictEqual(context.value.enterDelay, [5, 5]);
  assert.deepStrictEqual(context.value.exitFillOpacity, [0, 0]);
  assert.strictEqual(context.value.enter, undefined);
});

test("flow.append(shape, options) keeps strings that don't name a bound channel as constants, outside encoded flows", () => {
  const [shape, calls] = probe();
  render((root) => root.data([{name: "a"}]).append(shape, {text: "name", fill: "steelblue"}));
  assert.deepStrictEqual(calls[0].text, ["name"]);
  assert.deepStrictEqual(calls[0].fill, ["steelblue"]);
});
