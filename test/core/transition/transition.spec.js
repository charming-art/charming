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
  await root.finished();
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
  // The parts start in equal pieces of the whole's box, in order of position, then spread.
  assert.deepStrictEqual(rects(renderer), [
    [0, 0, 30, 30],
    [30, 0, 30, 30],
    [60, 0, 30, 30],
  ]);
  vi.advanceTimersByTime(176);
  assert.deepStrictEqual(
    rects(renderer).map(([x]) => x),
    [0, 60, 120],
  );
  whole();
  vi.advanceTimersByTime(80);
  // The parts move into the pieces of the whole, which appears once they've arrived.
  assert.deepStrictEqual(
    rects(renderer).map(([x, y, width]) => [x, y, width]),
    [
      [0, 50, 25],
      [45, 50, 25],
      [90, 50, 25],
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

// The translations of the groups of the rects, in order.
const translations = (renderer) =>
  Array.from(renderer.node().querySelectorAll("rect"), (r) =>
    r.parentNode
      .getAttribute("transform")
      .match(/-?[\d.]+/g)
      .map(Number),
  );

test("keyed marks match within the parent rows they're drawn under", () => {
  const [root, renderer] = chart();
  const draw = (dy) => {
    root
      .data([0, 80])
      .append(cm.g, {x: 0, y: (d) => d + dy, key: (d) => d})
      .append(cm.rect, {x: 0, y: 0, width: 10, height: 10, key: "a"});
    root.render();
  };
  draw(0);
  draw(40);
  vi.advanceTimersByTime(80);
  // Each rect moves with its own group, halfway down: no fading or crossing.
  assert.deepStrictEqual(translations(renderer), [
    [0, 20],
    [0, 100],
  ]);
});

test("shared marks drawn under each parent row match under their own row", () => {
  const [root, renderer] = chart();
  const draw = (dx) => {
    const groups = root.data([0, 100]).append(cm.g, {x: (d) => d + dx, y: 0, key: (d) => d});
    groups.append(cm.g).data(["a"]).append(cm.rect, {x: 0, y: 0, width: 10, height: 10});
    root.render();
  };
  draw(0);
  draw(40);
  vi.advanceTimersByTime(80);
  assert.deepStrictEqual(
    translations(renderer).map(([x]) => x),
    [20, 120],
  );
});

test("a keyed mark doesn't match an unkeyed one by datum: it exits and the other enters", () => {
  const [root, renderer] = chart();
  const datum = {};
  root.data([datum]).append(cm.rect, {x: 0, y: 0, width: 10, height: 10, key: "a"});
  root.render();
  root.data([datum]).append(cm.rect, {x: 80, y: 0, width: 10, height: 10});
  root.render();
  vi.advanceTimersByTime(80);
  assert.deepStrictEqual(
    rects(renderer).map(([x]) => x),
    [0, 80],
  );
});

test("texts and other discrete attributes jump at the end, even from a missing value or a color name", () => {
  const [root, renderer] = chart();
  const draw = (text) => {
    root.data([0]).append(cm.text, {x: 0, y: 0, text});
    root.render();
  };
  draw("red");
  draw("blue");
  vi.advanceTimersByTime(80);
  assert.strictEqual(renderer.node().querySelector("text").textContent, "red");
  vi.advanceTimersByTime(96);
  draw(undefined);
  vi.advanceTimersByTime(176);
  draw("hi");
  vi.advanceTimersByTime(80);
  assert.strictEqual(renderer.node().querySelector("text").textContent, "");
});

test("a group's translation interpolates even if it gains a rotation", () => {
  const [root, renderer] = chart();
  const draw = (x, rotate) => {
    root.data([0]).append(cm.g, {x, y: 0, rotate}).append(cm.rect, {x: 0, y: 0, width: 10, height: 10});
    root.render();
  };
  draw(0);
  draw(100, 1);
  vi.advanceTimersByTime(80);
  assert.match(renderer.node().querySelector("rect").parentNode.getAttribute("transform"), /^translate\(50,\s*0\)/);
});

test("marks drawn without translations aren't put in groups of their own", () => {
  const [root, renderer] = chart();
  bars(root, [{id: "a", value: 50}]);
  bars(root, [{id: "a", value: 100}]);
  vi.advanceTimersByTime(80);
  assert.strictEqual(renderer.node().querySelector("rect").parentNode, renderer.node());
});
