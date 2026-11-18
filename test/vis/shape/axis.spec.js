import assert from "node:assert";
import * as d3 from "d3";
import {test, vi} from "vitest";
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
  assert.ok(T.includes("0.08") && T.includes("frequency →"));
});

test("cm.axis skips an axis set to false", () => {
  assert.deepStrictEqual(texts({x: false, y: false}), []);
  const T = texts({y: false});
  assert.ok(T.includes("letter"));
  assert.ok(!T.includes("frequency →"));
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
    .transform(cm.plane, {x: {axis: null}})
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
  // The bottom of the chart is at 360; the tick is 6px and the padding 3px plus 4·cos 45°.
  assertInDelta(+a.getAttribute("y"), 360 + 6 + 3 + 4 * Math.cos(Math.PI / 4));
});

test("cm.axisX turns tick labels rotated by less than 10° around their center, like Plot", () => {
  const a = rotated({x: {tickRotate: -5}})("A");
  assert.strictEqual(a.getAttribute("text-anchor"), "middle");
  assert.strictEqual(a.getAttribute("dominant-baseline"), "text-before-edge");
  assert.strictEqual(+a.getAttribute("y"), 360 + 6 + 3);
});

test("cm.axisY pads steep tick labels by 4·cos θ, like Plot", () => {
  const find = rotated({y: {tickRotate: -70}});
  assertInDelta(+find("0.08").getAttribute("x"), 64 - 6 - 3 - 4 * Math.cos((70 * Math.PI) / 180));
  const upright = rotated({y: {tickRotate: -90}})("0.08");
  assertInDelta(+upright.getAttribute("x"), 64 - 6 - 3);
});

test("cm.axis labels facets only along the bottom of each column and the left of each row", () => {
  const renderer = cm.svg({width: 200, height: 200});
  const root = cm.flow().renderer(renderer);
  // A 2 × 2 grid without its top-left cell.
  root
    .data([
      ["b", "1"],
      ["a", "2"],
      ["b", "2"],
    ])
    .transform(cm.encode, {x: ([x]) => x, y: ([, y]) => y})
    .transform(cm.spreadX)
    .transform(cm.spreadY)
    .transform(cm.plane, {marginTop: 10, marginBottom: 40, marginLeft: 64, x: {axis: null}, y: {axis: null}})
    .append(cm.g)
    .data(() => [{v: 1}, {v: 2}])
    .transform(cm.encode, {x: "v", y: "v"})
    .transform(cm.plane)
    .add(cm.axis);
  root.render();
  // Tick labels are centered for x and end-aligned for y; each cell is a group at its band.
  const cellsOf = (anchor) =>
    new Set(
      Array.from(renderer.node().querySelectorAll(`text[text-anchor="${anchor}"]`), (t) =>
        t.parentNode
          .getAttribute("transform")
          .match(/[\d.]+/g)
          .map((d) => Math.round(d))
          .join(","),
      ),
    );
  const band = d3.scaleBand(["a", "b"], [64, 180]).padding(0.1);
  const rows = d3.scaleBand(["1", "2"], [10, 160]).padding(0.1);
  const at = (x, y) => `${Math.round(band(x))},${Math.round(rows(y))}`;
  // x: the bottom cell of each column, (a, 2) and (b, 2); y: the left cell of each row, (b, 1) and (a, 2).
  assert.deepStrictEqual(cellsOf("middle"), new Set([at("a", "2"), at("b", "2")]));
  assert.deepStrictEqual(cellsOf("end"), new Set([at("b", "1"), at("a", "2")]));
  // No cell titles its axes.
  const texts = Array.from(renderer.node().querySelectorAll("text"), (d) => d.textContent);
  assert.ok(!texts.some((d) => /v/.test(d)));
});

// The texts of axes in charts nested at the points of a parent chart, in a plane or polar.
function glyphTexts(coordinate) {
  const renderer = cm.svg({width: 200, height: 200});
  const root = cm.flow().renderer(renderer);
  root
    .data([
      {
        k: "a",
        rows: [
          {u: 1, w: 1},
          {u: 2, w: 2},
        ],
      },
      {
        k: "b",
        rows: [
          {u: 1, w: 1},
          {u: 2, w: 2},
        ],
      },
    ])
    .transform(cm.encode, {x: "k"})
    .transform(cm.spreadX)
    .transform(coordinate)
    .append(cm.g)
    .data((d) => d.rows)
    .transform(cm.encode, {x: "u", y: "w"})
    .transform(cm.plane, {width: 60, height: 60})
    .add(cm.axis);
  root.render();
  return Array.from(renderer.node().querySelectorAll("text"), (d) => d.textContent);
}

test("cm.axis draws no titles in charts nested in a polar chart, and labels each one's ticks", () => {
  const texts = glyphTexts(cm.polar);
  assert.ok(!texts.some((d) => /[uw]/.test(d)));
  // Each of the two glyphs labels its x ticks (1, 2) and its y ticks (1.0, 1.5, 2.0).
  assert.strictEqual(texts.filter((d) => d === "2").length, 2);
  assert.strictEqual(texts.filter((d) => d === "2.0").length, 2);
});

test("cm.axisX with anchor top labels the ticks above the chart, and titles it at the top", () => {
  const a = rotated({x: {anchor: "top"}, y: false})("A");
  // The top of the chart is at 10; the tick is 6px and the padding 3px.
  assert.strictEqual(+a.getAttribute("y"), 10 - 6 - 3);
  assert.strictEqual(a.getAttribute("dominant-baseline"), "text-after-edge");
  // The title sits 6px over the tick labels, 10px tall, on its bottom; a top axis needs a margin.
  const title = rotated({x: {anchor: "top"}, y: false})("letter");
  assert.strictEqual(+title.getAttribute("y"), 10 - 6 - 3 - 10 - 6);
  assert.strictEqual(title.getAttribute("dominant-baseline"), "text-after-edge");
});

test("cm.axisY with anchor right labels the ticks right of the chart, aligned to their start", () => {
  const find = rotated({x: false, y: {anchor: "right"}});
  const tick = find("0.08");
  // The right of the chart is at 620.
  assert.strictEqual(+tick.getAttribute("x"), 620 + 6 + 3);
  assert.strictEqual(tick.getAttribute("text-anchor"), "start");
  // The title is turned right of the tick labels, the widest 4 characters of 6px, 6px past them.
  const title = find("frequency →");
  assert.strictEqual(+title.getAttribute("x"), 620 + 6 + 3 + 24 + 6);
  assert.strictEqual(title.getAttribute("dominant-baseline"), "text-before-edge");
});

// The positions of the cells of a 2 × 2 grid whose tick labels have the given anchor, with options
// for its axes, and with rows only in the cells given.
function labeledCells(options, anchor, filled = () => true) {
  const renderer = cm.svg({width: 200, height: 200});
  const root = cm.flow().renderer(renderer);
  root
    .data(d3.cross(["a", "b"], ["1", "2"]))
    .transform(cm.encode, {x: ([x]) => x, y: ([, y]) => y})
    .transform(cm.spreadX)
    .transform(cm.spreadY)
    .transform(cm.plane, {marginTop: 10, marginBottom: 40, marginLeft: 64, x: {axis: null}, y: {axis: null}})
    .append(cm.g)
    .data((d) => (filled(d) ? [{v: 1}, {v: 2}] : []))
    .transform(cm.encode, {x: "v", y: "v"})
    .transform(cm.plane)
    .add(cm.axis, options);
  root.render();
  const columns = d3.scaleBand(["a", "b"], [64, 180]).padding(0.1);
  const rows = d3.scaleBand(["1", "2"], [10, 160]).padding(0.1);
  const name = ([x, y]) => [columns.domain().find((d) => Math.round(columns(d)) === x), y];
  return new Set(
    Array.from(renderer.node().querySelectorAll(`text[text-anchor="${anchor}"]`), (t) => {
      const [x, y] = t.parentNode
        .getAttribute("transform")
        .match(/[\d.]+/g)
        .map((d) => Math.round(d));
      const [column] = name([x]);
      return `${column}${rows.domain().find((d) => Math.round(rows(d)) === y)}`;
    }),
  );
}

test("cm.axis in facets labels the top row with anchor top, and the right column with anchor right", () => {
  assert.deepStrictEqual(labeledCells({x: {anchor: "top"}, y: false}, "middle"), new Set(["a1", "b1"]));
  assert.deepStrictEqual(labeledCells({x: false, y: {anchor: "right"}}, "start"), new Set(["b1", "b2"]));
});

test("cm.axis draws no axes in facets without rows, and labels the nearest facets with rows, like Plot", () => {
  // Without the bottom-left cell, the cell above it labels x, and the cell right of it labels y.
  const filled = ([x, y]) => !(x === "a" && y === "2");
  assert.deepStrictEqual(labeledCells({y: false}, "middle", filled), new Set(["a1", "b2"]));
  assert.deepStrictEqual(labeledCells({x: false}, "end", filled), new Set(["a1", "b2"]));
});

test("cm.axis keys its ticks by value, so that each tick moves to its own new place in transitions", () => {
  vi.useFakeTimers();
  const renderer = cm.svg({width: 200, height: 100});
  const root = cm.flow({transition: {duration: 160, ease: "linear"}}).renderer(renderer);
  const draw = (max, ticks) => {
    root
      .data([0, max])
      .transform(cm.encode, {x: (d) => d})
      .transform(cm.plane)
      .add(cm.axisX, {ticks});
    root.render();
  };
  draw(10, [5, 10]);
  draw(20, [0, 5, 10]);
  vi.advanceTimersByTime(80);
  const ten = Array.from(renderer.node().querySelectorAll("text")).find((t) => t.textContent === "10");
  vi.useRealTimers();
  // x is in [20, 180]: 10 moves from 180 to 100, so it's at 140 halfway, not on its way to 5's place.
  assert.strictEqual(+ten.getAttribute("x"), 140);
});

test("cm.axis keys date ticks by their time, so that ticks less than a second apart stay apart", () => {
  vi.useFakeTimers();
  const renderer = cm.svg({width: 200, height: 100});
  const root = cm.flow({transition: {duration: 160, ease: "linear"}}).renderer(renderer);
  const at = (ms) => new Date(Date.UTC(2020, 0, 1, 0, 0, 0, ms));
  const draw = (ticks) => {
    root
      .data([at(0), at(800)])
      .transform(cm.encode, {x: (d) => d})
      .transform(cm.plane)
      .add(cm.axisX, {ticks, tickFormat: (d) => `${d.getUTCMilliseconds()}`});
    root.render();
  };
  draw([at(200), at(400)]);
  draw([at(400), at(600)]);
  vi.advanceTimersByTime(80);
  const labels = Array.from(renderer.node().querySelectorAll("text"));
  const opacity = (label) => labels.find((t) => t.textContent === label)?.getAttribute("fill-opacity");
  vi.useRealTimers();
  // 400 stays, opaque; 200 fades out and 600 fades in.
  assert.strictEqual(opacity("400"), null);
  assert.strictEqual(+opacity("200"), 0.5);
  assert.strictEqual(+opacity("600"), 0.5);
});

test("cm.axis keys its ticks apart from the keys of marks, so that marks split from marks, not ticks", () => {
  vi.useFakeTimers();
  const renderer = cm.svg({width: 200, height: 200});
  const root = cm.flow({transition: {duration: 160, ease: "linear"}}).renderer(renderer);
  root
    .data([{k: "a", v: 10}])
    .transform(cm.encode, {x: "k", y: "v", key: "k"})
    .transform(cm.spreadX)
    .transform(cm.plane)
    .add(cm.axis)
    .add(cm.rect);
  root.render();
  root
    .data([0, 1, 2])
    .transform(cm.encode, {x: (d) => d, y: (d) => d})
    .transform(cm.plane)
    .add(cm.axis)
    .add(cm.circle, {r: 3, groupKey: "a"});
  root.render();
  vi.advanceTimersByTime(80);
  const count = (s) => renderer.node().querySelectorAll(s).length;
  vi.useRealTimers();
  // The bar splits into the points, through paths; it doesn't fade out on its own.
  assert.deepStrictEqual([count("rect"), count("path")], [0, 3]);
});

// Renders a rose with cm.polar and both axes, and returns the texts that aren't tick labels.
function polarTitles(polarOptions, axisOptions) {
  const renderer = cm.svg({width: 200, height: 200});
  const root = cm.flow().renderer(renderer);
  root
    .data([
      {name: "a", value: 10},
      {name: "b", value: 4},
    ])
    .transform(cm.encode, {x: "name", y: "value"})
    .transform(cm.spreadX)
    .transform(cm.polar, polarOptions)
    .add(cm.axis, axisOptions);
  root.render();
  const isTick = (t) => /^[\d.]+$/.test(t) || t === "a" || t === "b";
  return Array.from(renderer.node().querySelectorAll("text"), (d) => d.textContent).filter((t) => !isTick(t));
}

test("cm.axis in polar titles its axes only with the labels given to scales, not field names", () => {
  assert.deepStrictEqual(polarTitles(), []);
  assert.deepStrictEqual(polarTitles({x: {label: "Name"}, y: {label: "Value"}}), ["Name", "Value"]);
  // The label option of an axis gives a title, or hides one with null.
  assert.deepStrictEqual(polarTitles({y: {label: "Value"}}, {y: {label: null}, x: {label: "N"}}), ["N"]);
});

test("cm.axis in polar puts the radius title at the top left and the angle title at the bottom right", () => {
  const renderer = cm.svg({width: 200, height: 200});
  const root = cm.flow().renderer(renderer);
  root
    .data([{name: "a", value: 10}])
    .transform(cm.encode, {x: "name", y: "value"})
    .transform(cm.spreadX)
    .transform(cm.polar, {x: {label: "Name"}, y: {label: "Value"}})
    .add(cm.axis);
  root.render();
  const at = (t) => {
    const node = Array.from(renderer.node().querySelectorAll("text")).find((d) => d.textContent === t);
    return [+node.getAttribute("x"), +node.getAttribute("y")];
  };
  assert.deepStrictEqual(at("Value"), [3, 3]);
  assert.deepStrictEqual(at("Name"), [197, 197]);
});

test("cm.axis draws no titles for polar charts nested in a chart", () => {
  const renderer = cm.svg({width: 200, height: 100});
  const root = cm.flow().renderer(renderer);
  root
    .data(["A", "B"])
    .transform(cm.encode, {x: (d) => d})
    .transform(cm.spreadX)
    .transform(cm.plane, {margin: 0})
    .append(cm.g)
    .data([{v: 1}, {v: 2}])
    .transform(cm.encode, {x: "v"})
    .transform(cm.stackX)
    .transform(cm.polar, {x: {label: "Share"}})
    .add(cm.axisX);
  root.render();
  const T = Array.from(renderer.node().querySelectorAll("text"), (d) => d.textContent);
  assert.ok(!T.includes("Share"));
});

test("cm.axis places its titles past its tick labels, by a constant gap, with labelAnchor", () => {
  const titles = (options, axis = cm.axis) => {
    const renderer = cm.svg({width: 200, height: 100});
    const root = cm.flow().renderer(renderer);
    root
      .data([0, 1])
      .transform(cm.encode, {x: (d) => d, y: (d) => d})
      .transform(cm.plane, {margin: 40, x: {label: "X"}, y: {label: "Y"}})
      .add(axis, options);
    root.render();
    return Array.from(renderer.node().querySelectorAll("text"))
      .filter((d) => /[XY]/.test(d.textContent))
      .map((d) => [
        d.textContent,
        +d.getAttribute("x"),
        +d.getAttribute("y"),
        d.getAttribute("text-anchor"),
        d.getAttribute("transform"),
      ]);
  };
  // The frame is from 40 to 160 and 40 to 60. Under x: the tick 6, the padding 3, a label 10 and the
  // gap 6, at the right end of the axis. Left of y, beside its labels "0" and "1", 6px wide: turned,
  // centered on the axis, its arrow pointing up once turned.
  assert.deepStrictEqual(titles(), [
    ["X →", 100, 60 + 6 + 3 + 10 + 6, "middle", null],
    ["Y →", 40 - 6 - 3 - 6 - 6, 50, "middle", "rotate(-90,19,50)"],
  ]);
  // At the left or right end of x; at the top or the bottom of y, still turned.
  assert.deepStrictEqual(titles({x: {labelAnchor: "right"}, y: false})[0], ["X →", 160, 85, "end", null]);
  assert.deepStrictEqual(titles({x: {labelAnchor: "left"}, y: {labelAnchor: "top"}}), [
    ["X →", 40, 85, "start", null],
    ["Y →", 19, 40, "end", "rotate(-90,19,40)"],
  ]);
  assert.deepStrictEqual(titles({y: {labelAnchor: "bottom"}, x: false})[0], [
    "Y →",
    19,
    60,
    "start",
    "rotate(-90,19,60)",
  ]);
  // Without tick labels, past the ticks; without both, past the axis itself.
  assert.deepStrictEqual(titles({x: {tickFormat: () => ""}, y: false})[0], ["X →", 100, 60 + 6 + 6, "middle", null]);
  assert.deepStrictEqual(titles({x: {tickFormat: () => "", tickSize: 0}, y: false})[0], [
    "X →",
    100,
    60 + 6,
    "middle",
    null,
  ]);
});

// Renders a chart of x and y in [0, 1] with the options of cm.plane and the given shapes added, and
// returns the texts of its axes with their anchors.
function implicit(plane, add = (flow) => flow, {coordinate = cm.plane} = {}) {
  const renderer = cm.svg({width: 200, height: 200});
  const root = cm.flow().renderer(renderer);
  add(
    root
      .data([
        {x: 0, y: 0},
        {x: 1, y: 1},
      ])
      .transform(cm.encode, {x: "x", y: "y"})
      .transform(coordinate, {margin: 30, ...plane}),
  );
  root.render();
  return Array.from(renderer.node().querySelectorAll("text"), (t) => t.textContent);
}

test("cm.plane draws the axes of its positions by default, at the bottom and the left", () => {
  const T = implicit();
  assert.deepStrictEqual(
    T,
    implicit({}, (flow) => flow.add(cm.axis)),
  );
  assert.ok(T.includes("x →") && T.includes("y →"));
});

test("cm.plane hides an axis with axis null", () => {
  assert.deepStrictEqual(implicit({x: {axis: null}, y: {axis: null}}), []);
  const T = implicit({y: {axis: null}});
  assert.ok(T.includes("x →") && !T.includes("y →"));
});

test("cm.plane places an axis with axis, on a side or both", () => {
  const ticks = (plane) => {
    const renderer = cm.svg({width: 200, height: 200});
    const root = cm.flow().renderer(renderer);
    root
      .data([0, 1])
      .transform(cm.encode, {x: (d) => d, y: (d) => d})
      .transform(cm.plane, {margin: 30, y: {axis: null}, ...plane});
    root.render();
    return Array.from(renderer.node().querySelectorAll("text"))
      .filter((t) => t.textContent === "0.0")
      .map((t) => +t.getAttribute("y"));
  };
  assert.deepStrictEqual(ticks(), [179]);
  assert.deepStrictEqual(ticks({x: {axis: "top"}}), [21]);
  assert.deepStrictEqual(ticks({x: {axis: "both"}}), [179, 21]);
  assert.deepStrictEqual(ticks({x: {axis: true}}), [179]);
});

test("cm.plane passes the options of a position to its axis, such as a tick format", () => {
  const T = implicit({x: {tickFormat: (d) => `[${d}]`, label: "X"}, y: {axis: null}});
  assert.ok(T.includes("[0]") && T.includes("X →"));
  // Options given to cm.axis explicitly come first.
  const E = implicit({x: {tickFormat: (d) => `[${d}]`}, y: {axis: null}}, (flow) =>
    flow.add(cm.axis, {x: {tickFormat: (d) => `<${d}>`}, y: false}),
  );
  assert.ok(E.includes("<0>") && !E.includes("[0]"));
});

test("an axis added explicitly replaces the implicit axis of its kind", () => {
  const x = implicit({}, (flow) => flow.add(cm.axisX, {label: "X"}));
  assert.ok(x.includes("X") && !x.includes("x →") && x.includes("y →"));
  // cm.axis replaces both, even the axis it skips.
  assert.deepStrictEqual(
    implicit({}, (flow) => flow.add(cm.axis, {x: false, y: false})),
    [],
  );
  // An explicit axis defaults to the side given to the plane.
  const top = implicit({x: {axis: "top"}, y: {axis: null}}, (flow) => flow.add(cm.axis, {y: false}));
  assert.deepStrictEqual(top, implicit({x: {axis: "top"}, y: {axis: null}}));
});

test("cm.plane draws the axes of a layer of branches once per scale", () => {
  const renderer = cm.svg({width: 200, height: 200});
  const root = cm.flow().renderer(renderer);
  const [a, b] = root
    .data([
      {x: 0, a: 0, b: 0},
      {x: 1, a: 1, b: 10},
    ])
    .branch(
      (flow) => flow.transform(cm.encode, {x: "x", y: {value: "a", scale: "a"}}),
      (flow) => flow.transform(cm.encode, {x: "x", y: {value: "b", scale: "b"}}),
    )
    .transform(cm.plane, {margin: 30, a: {label: "A"}, b: {label: "B", axis: "right"}});
  a.add(cm.line);
  b.add(cm.line);
  root.render();
  const T = Array.from(renderer.node().querySelectorAll("text"), (t) => t.textContent);
  // One x axis for both layers, and an axis of y per scale, each on its side.
  assert.strictEqual(T.filter((d) => d === "x →").length, 1, T);
  assert.strictEqual(T.filter((d) => d === "A →").length, 1, T);
  assert.strictEqual(T.filter((d) => d === "B →").length, 1, T);
  const ten = Array.from(renderer.node().querySelectorAll("text")).find((t) => t.textContent === "10");
  assert.strictEqual(ten.getAttribute("text-anchor"), "start");
});

test("cm.plane draws the axes of layers in each cell of a nested chart where a layer has rows", () => {
  const renderer = cm.svg({width: 400, height: 200});
  const root = cm.flow().renderer(renderer);
  const rows = [{v: 1}, {v: 2}];
  const [left, right] = root
    .data(["L", "R"])
    .transform(cm.encode, {x: (d) => d})
    .transform(cm.spreadX)
    .transform(cm.plane, {x: {axis: null}})
    .append(cm.g)
    .branch(
      (flow) => flow.data((cell) => (cell === "L" ? rows : [])).transform(cm.encode, {x: "v", y: "v"}),
      (flow) => flow.data((cell) => (cell === "R" ? rows : [])).transform(cm.encode, {x: "v", y: "v"}),
    )
    .transform(cm.plane, {x: {axis: "bottom"}, y: {axis: null}});
  left.add(cm.circle);
  right.add(cm.circle);
  root.render();
  // The first layer has no rows in the right cell, so the second labels it.
  const cells = Array.from(renderer.node().querySelectorAll("text"))
    .filter((t) => t.textContent === "1.0")
    .map((t) => t.parentNode.getAttribute("transform"));
  assert.strictEqual(new Set(cells).size, 2);
});

test("cm.plane draws an axis in a later layer if an earlier layer has no scale for it", () => {
  const renderer = cm.svg({width: 200, height: 200});
  const root = cm.flow().renderer(renderer);
  const [a, b] = root
    .data([
      {x: 0, y: 0},
      {x: 1, y: 1},
    ])
    .branch(
      (flow) => flow.transform(cm.encode, {x: "x"}),
      (flow) => flow.transform(cm.encode, {x: "x", y: "y"}),
    )
    .transform(cm.plane, {margin: 30});
  a.add(cm.circle);
  b.add(cm.circle);
  root.render();
  const T = Array.from(renderer.node().querySelectorAll("text"), (t) => t.textContent);
  assert.strictEqual(T.filter((d) => d === "x →").length, 1);
  assert.strictEqual(T.filter((d) => d === "y →").length, 1);
});

test("an explicit axis replaces the implicit ones only in the cells where it draws", () => {
  const renderer = cm.svg({width: 400, height: 200});
  const root = cm.flow().renderer(renderer);
  const rows = [{v: 1}, {v: 2}];
  const [left, right] = root
    .data(["L", "R"])
    .transform(cm.encode, {x: (d) => d})
    .transform(cm.spreadX)
    .transform(cm.plane, {x: {axis: null}})
    .append(cm.g)
    .branch(
      (flow) => flow.data((cell) => (cell === "L" ? rows : [])).transform(cm.encode, {x: "v", y: "v"}),
      (flow) => flow.data(() => rows).transform(cm.encode, {x: "v", y: "v"}),
    )
    .transform(cm.plane, {x: {axis: "bottom"}, y: {axis: null}});
  left.add(cm.axisX, {tickFormat: (d) => `<${d}>`}).add(cm.circle);
  right.add(cm.circle);
  root.render();
  const T = Array.from(renderer.node().querySelectorAll("text"), (t) => t.textContent);
  // The left cell has the explicit axis, and the right one, where it has no rows, the implicit one.
  assert.strictEqual(T.filter((d) => d === "<1>").length, 1);
  assert.strictEqual(T.filter((d) => d === "1.0").length, 1);
});

test("cm.plane draws the grid and the title of an axis on both sides once, on its first side", () => {
  const renderer = cm.svg({width: 200, height: 200});
  const root = cm.flow().renderer(renderer);
  root
    .data([
      {x: 0, y: 0},
      {x: 1, y: 1},
    ])
    .transform(cm.encode, {x: "x", y: "y"})
    .transform(cm.plane, {margin: 30, x: {axis: "both", grid: true}, y: {axis: null}});
  root.render();
  const node = renderer.node();
  const titles = Array.from(node.querySelectorAll("text")).filter((t) => t.textContent === "x →");
  assert.deepStrictEqual(
    titles.map((t) => +t.getAttribute("y")),
    [170 + 6 + 3 + 10 + 6],
  );
  // One grid line per tick, across the frame, and ticks on both sides.
  const lines = Array.from(node.querySelectorAll("line"), (l) => [+l.getAttribute("y1"), +l.getAttribute("y2")]);
  assert.strictEqual(lines.filter(([y1, y2]) => Math.abs(y2 - y1) === 140).length, 3);
  assert.strictEqual(lines.filter(([y1, y2]) => Math.abs(y2 - y1) === 6).length, 6);
});

test("cm.plane draws no axes in charts nested in a chart, unless asked", () => {
  const nested = (options) => {
    const renderer = cm.svg({width: 200, height: 200});
    const root = cm.flow().renderer(renderer);
    root
      .data(["a"])
      .transform(cm.encode, {x: (d) => d})
      .transform(cm.spreadX)
      .transform(cm.plane, {x: {axis: null}})
      .append(cm.g)
      .data([0, 1])
      .transform(cm.encode, {x: (d) => d, y: (d) => d})
      .transform(cm.plane, options);
    root.render();
    return Array.from(renderer.node().querySelectorAll("text"), (t) => t.textContent);
  };
  assert.deepStrictEqual(nested(), []);
  assert.ok(nested({x: {axis: "bottom"}}).includes("0.0"));
});

test("cm.polar draws its angle axis outside and inside its ring with axis both", () => {
  const radii = (plane) => {
    const renderer = cm.svg({width: 200, height: 200});
    const root = cm.flow().renderer(renderer);
    root
      .data([
        {x: 0, y: 1},
        {x: 1, y: 2},
      ])
      .transform(cm.encode, {x: "x", y: "y"})
      .transform(cm.polar, {margin: 0, innerRadius: 0.5, ...plane});
    root.render();
    const texts = Array.from(renderer.node().querySelectorAll("text")).filter((t) => t.textContent === "0.0");
    return texts.map((t) => Math.round(Math.hypot(+t.getAttribute("x") - 100, +t.getAttribute("y") - 100)));
  };
  const [inner] = radii({x: {axis: true}});
  const both = radii({x: {axis: "both"}});
  assert.strictEqual(both.length, 2);
  assert.ok(both.includes(inner));
  assert.ok(Math.max(...both) > 100 * 0.5 && Math.min(...both) < 100 * 0.5);
  // The radius axis has one side.
  assert.deepStrictEqual(radii({y: {axis: "both"}}), radii({y: {axis: true}}));
});

test("cm.polar draws no axes unless asked", () => {
  assert.deepStrictEqual(implicit({}, undefined, {coordinate: cm.polar}), []);
  const T = implicit({x: {axis: true}}, undefined, {coordinate: cm.polar});
  assert.deepStrictEqual(
    T,
    implicit({}, (flow) => flow.add(cm.axisX), {coordinate: cm.polar}),
  );
  assert.ok(T.length > 0);
});
