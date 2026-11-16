import assert from "node:assert";
import {afterEach, beforeEach, test, vi} from "vitest";
import "../../install-canvas-mock.js";
import * as cm from "../../../src/index.js";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

// A flow with linear transitions of 160ms on a 200 × 200 SVG, so that 80ms is halfway.
function chart(options) {
  const renderer = cm.svg({width: 200, height: 200});
  const root = cm.flow({transition: {duration: 160, ease: "linear", ...options}}).renderer(renderer);
  return [root, renderer];
}

const attrs = (element, ...names) =>
  names.map((name) => {
    const v = element.getAttribute(name);
    return v !== null && !isNaN(v) ? +v : v;
  });

const rects = (renderer) =>
  Array.from(renderer.node().querySelectorAll("rect"), (r) => attrs(r, "x", "y", "width", "height"));

// Bars by id: x by index, growing up from y = 200.
function bars(root, data, options) {
  root
    .data(data)
    .transform(cm.bind, {
      x: (d, i) => i * 30,
      y: (d) => 200 - d.value,
      width: () => 20,
      height: (d) => d.value,
      key: (d) => d.id,
    })
    .append(cm.rect, options);
  root.render();
}

test("transitions are off by default, and the first render with them is drawn as it is", () => {
  const renderer = cm.svg({width: 200, height: 200});
  const root = cm.flow().renderer(renderer);
  bars(root, [{id: "a", value: 50}]);
  assert.deepStrictEqual(rects(renderer), [[0, 150, 20, 50]]);
  const [root2, renderer2] = chart();
  bars(root2, [{id: "a", value: 50}]);
  assert.deepStrictEqual(rects(renderer2), [[0, 150, 20, 50]]);
});

test("bars matched by key update, new ones enter from their enter state, and removed ones exit to their exit state", async () => {
  const [root, renderer] = chart();
  const states = {enter: {y: 200, height: 0}, exit: {y: 200, height: 0}};
  bars(
    root,
    [
      {id: "a", value: 50},
      {id: "b", value: 80},
    ],
    states,
  );
  bars(
    root,
    [
      {id: "b", value: 120},
      {id: "c", value: 30},
    ],
    states,
  );
  vi.advanceTimersByTime(80);
  // a sinks to the bottom, b slides left and grows, and c rises from the bottom.
  assert.deepStrictEqual(rects(renderer), [
    [0, 175, 20, 25],
    [15, 100, 20, 100],
    [30, 185, 20, 15],
  ]);
  vi.advanceTimersByTime(96);
  await root.transition();
  assert.deepStrictEqual(rects(renderer), [
    [0, 80, 20, 120],
    [30, 170, 20, 30],
  ]);
});

test("marks without keys match by datum, such as a step of a bubble sort", () => {
  const [root, renderer] = chart();
  const [a, b] = [{value: 50}, {value: 100}];
  const draw = (data) => {
    root
      .data(data)
      .transform(cm.bind, {x: (d, i) => i * 100, y: () => 0, width: () => 20, height: (d) => d.value})
      .append(cm.rect);
    root.render();
  };
  draw([a, b]);
  draw([b, a]);
  vi.advanceTimersByTime(80);
  // Both bars are halfway to the other's place, keeping their heights.
  assert.deepStrictEqual(rects(renderer), [
    [50, 0, 20, 100],
    [50, 0, 20, 50],
  ]);
});

test("each mark has its own timing, such as a stagger by row", () => {
  const [root, renderer] = chart();
  const draw = (y) => {
    root
      .data([0, 1, 2])
      .transform(cm.bind, {x: (d) => d * 50, y: () => y, r: () => 5, delay: (d) => d * 80})
      .append(cm.circle);
    root.render();
  };
  draw(0);
  draw(160);
  vi.advanceTimersByTime(160);
  const cy = Array.from(renderer.node().querySelectorAll("circle"), (c) => +c.getAttribute("cy"));
  // At 160ms, the first is done, the second halfway, and the third just starting.
  assert.deepStrictEqual(cy, [160, 80, 0]);
});

test("enter states can vary by row, with functions of the rows", () => {
  const [root, renderer] = chart();
  bars(root, []);
  bars(
    root,
    [
      {id: "a", value: 50, top: true},
      {id: "b", value: 50, top: false},
    ],
    {enter: {y: (d) => (d.datum.top ? 0 : 200)}},
  );
  vi.advanceTimersByTime(80);
  assert.deepStrictEqual(
    rects(renderer).map(([, y]) => y),
    [75, 175],
  );
});

test("colors interpolate in RGB", () => {
  const [root, renderer] = chart();
  const draw = (fill) => {
    root.data([0]).append(cm.rect, {x: 0, y: 0, width: 10, height: 10, fill});
    root.render();
  };
  draw("red");
  draw("blue");
  vi.advanceTimersByTime(80);
  assert.strictEqual(renderer.node().querySelector("rect").getAttribute("fill"), "rgb(128, 0, 128)");
});

test("a group that moves carries its children", () => {
  const [root, renderer] = chart();
  const draw = (x) => {
    root.data([0]).append(cm.g, {x, y: 0}).append(cm.rect, {x: 0, y: 0, width: 10, height: 10});
    root.render();
  };
  draw(0);
  draw(100);
  vi.advanceTimersByTime(80);
  assert.match(renderer.node().querySelector("rect").parentNode.getAttribute("transform"), /translate\(50,\s*0\)/);
});

test("marks split from the mark keyed by their group key, and merge back into it", () => {
  const [root, renderer] = chart();
  const whole = () => {
    root.data([0]).append(cm.rect, {x: 0, y: 0, width: 90, height: 30, key: "A"});
    root.render();
  };
  const parts = () => {
    root.data([0, 1, 2]).append(cm.rect, {x: (d) => d * 60, y: 100, width: 20, height: 30, groupKey: "A"});
    root.render();
  };
  whole();
  parts();
  vi.advanceTimersByTime(0);
  // The parts start in the whole's box, then spread to their own.
  assert.deepStrictEqual(rects(renderer), [
    [0, 0, 90, 30],
    [0, 0, 90, 30],
    [0, 0, 90, 30],
  ]);
  vi.advanceTimersByTime(176);
  assert.deepStrictEqual(
    rects(renderer).map(([x]) => x),
    [0, 60, 120],
  );
  whole();
  vi.advanceTimersByTime(80);
  // The parts move into the whole, which appears once they've arrived.
  assert.deepStrictEqual(
    rects(renderer).map(([x, y, width]) => [x, y, width]),
    [
      [0, 50, 55],
      [30, 50, 55],
      [60, 50, 55],
    ],
  );
  vi.advanceTimersByTime(96);
  assert.deepStrictEqual(rects(renderer), [[0, 0, 90, 30]]);
});

test("a render during a transition starts from the marks as they are shown", () => {
  const [root, renderer] = chart();
  bars(root, [{id: "a", value: 0}]);
  bars(root, [{id: "a", value: 100}]);
  vi.advanceTimersByTime(80);
  bars(root, [{id: "a", value: 0}]);
  // It starts at the height of 50 shown, not at 100.
  assert.deepStrictEqual(rects(renderer), [[0, 150, 20, 50]]);
});

test("transitions draw on Canvas too, and other renderers throw an error", () => {
  const canvas = cm.canvas({width: 100, height: 100, dpi: 1});
  const root = cm.flow({transition: true}).renderer(canvas);
  root.data([0]).append(cm.rect, {x: 0, y: 0, width: 10, height: 10});
  assert.doesNotThrow(() => root.render());
  const terminal = cm.flow({transition: true}).renderer({});
  terminal.data([0]).append(cm.rect, {x: 0, y: 0, width: 1, height: 1});
  assert.throws(() => terminal.render(), /only support the SVG and Canvas renderers/);
});

test("transitions on SVG update the same elements from frame to frame", () => {
  const [root, renderer] = chart();
  bars(root, [{id: "a", value: 50}]);
  const rect = renderer.node().querySelector("rect");
  bars(root, [{id: "a", value: 100}]);
  vi.advanceTimersByTime(80);
  assert.strictEqual(renderer.node().querySelector("rect"), rect);
  vi.advanceTimersByTime(96);
  assert.strictEqual(renderer.node().querySelector("rect"), rect);
  assert.deepStrictEqual(rects(renderer), [[0, 100, 20, 100]]);
});

test("marks with a group key whose group mark stays match themselves rather than entering again", () => {
  const [root, renderer] = chart();
  const draw = (y) => {
    root.data([0]).append(cm.rect, {x: 0, y: 0, width: 90, height: 30, key: "A"});
    root.data([0, 1]).append(cm.rect, {x: (d) => d * 60, y, width: 20, height: 30, groupKey: "A"});
    root.render();
  };
  draw(100);
  draw(140);
  vi.advanceTimersByTime(80);
  // The parts move from 100 to 140, without fading in.
  const parts = Array.from(renderer.node().querySelectorAll("rect")).slice(1);
  assert.deepStrictEqual(
    parts.map((r) => [+r.getAttribute("y"), r.getAttribute("fill-opacity")]),
    [
      [120, null],
      [120, null],
    ],
  );
});
