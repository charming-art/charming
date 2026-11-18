import assert from "node:assert";
import * as d3 from "d3";
import {test} from "vitest";
import "../../install-canvas-mock.js";
import * as cm from "../../../src/index.js";
import {widthOf} from "../../../src/vis/shape/axisUtils.js";
import {assertInDelta} from "../../helpers.js";

// The width of a swatch with its label, measured like Plot's, by the widths of its characters.
const swatch = (label) => 10 + 4 + widthOf(label);

// Renders a chart of the channels with cm.legend and returns the renderer's node.
function legend(channels, options, plane = {}, width = 400) {
  const renderer = cm.svg({width, height: 200});
  const root = cm.flow().renderer(renderer);
  root
    .data([
      {k: "a", v: 1},
      {k: "b", v: 4},
      {k: "c", v: 9},
    ])
    .transform(cm.encode, {x: "v", y: "v", ...channels})
    .transform(cm.plane, {marginRight: 150, x: {axis: null}, y: {axis: null}, ...plane})
    .add(cm.legend, options);
  root.render();
  return renderer.node();
}

const texts = (node) => Array.from(node.querySelectorAll("text"), (t) => t.textContent);
const rects = (node) => Array.from(node.querySelectorAll("rect"));

test("cm.legend draws a swatch per category of a color, labeled, after the title of the scale", () => {
  const node = legend({fill: "k"});
  assert.deepStrictEqual(texts(node), ["k", "a", "b", "c"]);
  assert.deepStrictEqual(
    rects(node).map((r) => r.getAttribute("fill")),
    ["#5470c6", "#91cc75", "#fac858"],
  );
});

test("cm.legend draws a ramp for a continuous color, with ticks, within the margin", () => {
  const node = legend({fill: "v"});
  const slices = rects(node);
  assert.strictEqual(slices.length, 64);
  // The ramp narrows to fit the margin, ending 3px from the right of the chart.
  const last = slices[63];
  assert.ok(+last.getAttribute("x") + +last.getAttribute("width") <= 400 - 3 + 1e-6);
  // The ramp goes from the color of the lowest value to that of the highest.
  assert.notStrictEqual(slices[0].getAttribute("fill"), slices[63].getAttribute("fill"));
  assert.ok(texts(node).includes("v"));
  assert.ok(texts(node).some((t) => /^\d/.test(t)));
});

test("cm.legend draws a ramp of opacities in the current color", () => {
  const node = legend({fillOpacity: "v"});
  const slices = rects(node);
  assert.strictEqual(slices[0].getAttribute("fill"), "currentColor");
  assert.ok(+slices[0].getAttribute("fill-opacity") < +slices[63].getAttribute("fill-opacity"));
});

test("cm.legend draws circles at a few ticks of a radius, sized by its scale, each labeled", () => {
  const node = legend({r: "v"});
  const circles = Array.from(node.querySelectorAll("circle"), (c) => +c.getAttribute("r"));
  assert.ok(circles.length >= 2);
  assert.deepStrictEqual(
    circles,
    circles.slice().sort((a, b) => a - b),
  );
  assert.ok(texts(node).includes("v"));
});

test("cm.legend takes options per scale, such as a label, or false to skip a legend", () => {
  const node = legend({fill: "k", r: "v"}, {fill: {label: "Kind"}, r: false});
  assert.deepStrictEqual(texts(node), ["Kind", "a", "b", "c"]);
  assert.strictEqual(node.querySelectorAll("circle").length, 0);
  assert.deepStrictEqual(texts(legend({fill: "k"}, {label: null})), ["a", "b", "c"]);
});

test("cm.legend lays out its legends at the top by default, horizontal, from the left of the plot", () => {
  const node = legend({fill: "k", r: "v"});
  // The frame starts at 20, without axes; the legends start 3px from the top.
  const [title] = node.querySelectorAll("text");
  assert.deepStrictEqual([+title.getAttribute("x"), +title.getAttribute("y")], [20, 3]);
  // The swatches are side by side, in a row.
  const swatches = rects(node);
  assert.strictEqual(new Set(swatches.map((r) => r.getAttribute("y"))).size, 1);
  const xs = swatches.map((r) => +r.getAttribute("x"));
  assert.deepStrictEqual(
    xs,
    xs.slice().sort((a, b) => a - b),
  );
  // The size legend fits beside them, 20px past their three swatches, with gaps of 12.
  const row = swatch("a") + 12 + swatch("b") + 12 + swatch("c");
  const sizeTitle = Array.from(node.querySelectorAll("text")).find((t) => t.textContent === "v");
  assertInDelta(+sizeTitle.getAttribute("x"), 20 + row + 20);
  assert.strictEqual(+sizeTitle.getAttribute("y"), 3);
  // Its circles are side by side, centered on one line, like Vega-Lite's, each labeled at its right,
  // centered on the line too.
  const circles = Array.from(node.querySelectorAll("circle"), (c) => ({
    cx: +c.getAttribute("cx"),
    cy: +c.getAttribute("cy"),
    r: +c.getAttribute("r"),
  }));
  assert.ok(circles.every(({cx, r}) => cx - r >= 20 + row + 20 - 1e-6));
  assert.strictEqual(new Set(circles.map(({cy}) => cy)).size, 1);
  const labels = Array.from(node.querySelectorAll("text")).filter((t) => t.getAttribute("y") === `${circles[0].cy}`);
  assert.strictEqual(labels.length, circles.length);
  labels.forEach((t, i) => {
    assertInDelta(+t.getAttribute("x"), circles[i].cx + circles[i].r + 4);
    assert.strictEqual(t.getAttribute("dominant-baseline"), "central");
  });
});

test("cm.legend starts a new row at the top for a legend that doesn't fit beside the others", () => {
  // From 300, the 97px left hold the swatches, about 84px, but not the sizes beside them.
  const node = legend({fill: "k", r: "v"}, {}, {marginLeft: 300});
  const sizeTitle = Array.from(node.querySelectorAll("text")).find((t) => t.textContent === "v");
  // Under the swatches, a title and a row of 14 each, by a gap of 10.
  assert.deepStrictEqual([+sizeTitle.getAttribute("x"), +sizeTitle.getAttribute("y")], [300, 3 + 28 + 10]);
});

test("cm.legend starts a new column on the right for a legend that doesn't fit under the others", () => {
  // The frame is 10 to 70 tall: the swatches, 56px, fit, but not the sizes under them.
  const node = legend({fill: "k", r: "v"}, {anchor: "right"}, {marginBottom: 130});
  const sizeTitle = Array.from(node.querySelectorAll("text")).find((t) => t.textContent === "v");
  // Right of the swatches, as wide as the widest, by a gap of 20, from the top of the frame.
  assertInDelta(+sizeTitle.getAttribute("x"), 400 - 150 + 12 + swatch("b") + 20);
  assert.strictEqual(+sizeTitle.getAttribute("y"), 10);
});

test("cm.legend wraps the swatches of a legend on the right into columns past the height of the frame", () => {
  // The frame is 10 to 40 tall: under the title, one swatch per column, gaps of 12.
  const node = legend({fill: "k"}, {anchor: "right"}, {marginBottom: 160});
  const x0 = 400 - 150 + 12;
  const positions = rects(node).map((r) => [+r.getAttribute("x"), +r.getAttribute("y")]);
  [x0, x0 + swatch("a") + 12, x0 + swatch("a") + 12 + swatch("b") + 12].forEach((x, i) => {
    assertInDelta(positions[i][0], x);
    assert.strictEqual(positions[i][1], 10 + 14 + 1);
  });
});

test("cm.legend wraps the swatches of a legend at the top past the width of the chart", () => {
  const node = legend({fill: "k"}, {}, {marginLeft: 340});
  // From 340, the 57px left before the right edge hold two swatches with their labels, about 20px
  // each, with a gap of 12; the third wraps to the next row.
  const positions = rects(node).map((r) => [+r.getAttribute("x"), +r.getAttribute("y")]);
  assertInDelta(positions[1][0], 340 + swatch("a") + 12);
  assert.deepStrictEqual(
    [positions[0], positions[1][1], positions[2]],
    [[340, 3 + 14 + 1], 3 + 14 + 1, [340, 3 + 28 + 1]],
  );
});

test("cm.legend stacks its legends in a column right of the frame with anchor right, vertical", () => {
  const node = legend({fill: "k", r: "v"}, {anchor: "right"});
  // The frame ends at 400 - 150 and starts at 10; the column starts 12px right of it.
  const [title] = node.querySelectorAll("text");
  assert.deepStrictEqual([+title.getAttribute("x"), +title.getAttribute("y")], [400 - 150 + 12, 10]);
  const swatches = rects(node);
  assert.deepStrictEqual(new Set(swatches.map((r) => r.getAttribute("x"))).size, 1);
  const ys = swatches.map((r) => +r.getAttribute("y"));
  assert.deepStrictEqual(
    ys,
    ys.slice().sort((a, b) => a - b),
  );
  // The size legend is under the swatches, its circles from the smallest down, on one line.
  const circles = Array.from(node.querySelectorAll("circle"), (c) => [+c.getAttribute("cx"), +c.getAttribute("cy")]);
  assert.ok(circles.every(([, cy]) => cy > ys[ys.length - 1]));
  assert.strictEqual(new Set(circles.map(([cx]) => cx)).size, 1);
  assert.deepStrictEqual(
    circles.map(([, cy]) => cy),
    circles.map(([, cy]) => cy).sort((a, b) => a - b),
  );
});

test("cm.legend stands a ramp up on the right, low values at the bottom, with ticks right of it", () => {
  const node = legend({fill: "v"}, {anchor: "right"});
  const slices = rects(node);
  assert.strictEqual(slices.length, 64);
  // The first slice, of the lowest values, is at the bottom of the 120px ramp, under a title of 18.
  assertInDelta(+slices[0].getAttribute("y") + +slices[0].getAttribute("height"), 10 + 18 + 120);
  assert.ok(+slices[63].getAttribute("y") < +slices[0].getAttribute("y"));
  const ticks = Array.from(node.querySelectorAll("text")).filter((t) => /^\d+$/.test(t.textContent));
  assert.ok(ticks.every((t) => +t.getAttribute("x") === 400 - 150 + 12 + 10 + 4));
  // The labels at the ends are aligned inward, so that they stay within the ramp's height; without a
  // title, the ramp starts at the top of the frame, 10.
  const ends = margin([{v: 0}, {v: 10}], {fill: (d) => d.v}, 150);
  const labels = Array.from(ends.querySelectorAll("text")).filter((t) => /^\d+$/.test(t.textContent));
  const [low, high] = [labels.find((t) => t.textContent === "0"), labels.find((t) => t.textContent === "10")];
  assert.deepStrictEqual(
    [+low.getAttribute("y"), low.getAttribute("dominant-baseline")],
    [10 + 120, "text-after-edge"],
  );
  assert.deepStrictEqual([+high.getAttribute("y"), high.getAttribute("dominant-baseline")], [10, "text-before-edge"]);
});

test("cm.plane gives room to the legends at the top, and turns the title of y under them", () => {
  const chart = (fill) => {
    const renderer = cm.svg({width: 400, height: 300});
    const root = cm.flow().renderer(renderer);
    const [context] = root
      .data([
        {k: "a", v: 1},
        {k: "b", v: 4},
      ])
      .transform(cm.encode, {x: "v", y: "v", fill: "k"})
      .transform(cm.plane, {fill})._values;
    root.render();
    return [
      context.frame,
      Array.from(renderer.node().querySelectorAll("text")).find(
        (t) => /\bv\b/.test(t.textContent) && t.getAttribute("transform"),
      ),
    ];
  };
  const [level] = chart({});
  // Over the legend's title and swatches, 3 + 14 + 14, and a gap of 10, the half of a tick label.
  const [frame, title] = chart({legend: true});
  assert.strictEqual(frame.top, 3 + 14 + 14 + 10 + 10);
  assert.ok(frame.top !== level.top);
  // The title of y is turned beside its tick labels, 6 + 10 more, ending at the top of the plot.
  assertInDelta(frame.left, level.left + 16);
  assert.strictEqual(title.textContent, "v →");
  assert.strictEqual(title.getAttribute("text-anchor"), "end");
  assert.strictEqual(+title.getAttribute("y"), frame.top);
  // A legend on the right leaves the top and the title as they are, and takes a right margin past the
  // end of the last tick label of x, half of "4", of 12, its width, as wide as its widest swatch,
  // and 3px.
  const [right] = chart({legend: "right"});
  assert.deepStrictEqual([right.top, right.left, right.bottom], [level.top, level.left, level.bottom]);
  assertInDelta(400 - right.right, widthOf("4") / 2 + 12 + Math.max(swatch("a"), swatch("b")) + 3);
});

test("cm.legend draws nothing in charts nested in a chart, nor without scales to show", () => {
  const renderer = cm.svg({width: 200, height: 100});
  const root = cm.flow().renderer(renderer);
  root
    .data(["A", "B"])
    .transform(cm.encode, {x: (d) => d})
    .transform(cm.spreadX)
    .transform(cm.plane, {x: {axis: null}})
    .append(cm.g)
    .data([{k: "a"}])
    .transform(cm.encode, {fill: "k"})
    .transform(cm.plane)
    .add(cm.legend);
  root.render();
  assert.strictEqual(renderer.node().querySelectorAll("text").length, 0);
  assert.strictEqual(texts(legend({})).length, 0);
});

test("cm.legend in cm.polar stacks its legends right of the disc, from its top", () => {
  const renderer = cm.svg({width: 400, height: 300});
  const root = cm.flow().renderer(renderer);
  root
    .data([
      {k: "a", v: 1},
      {k: "b", v: 2},
    ])
    .transform(cm.encode, {x: "v", fill: "k"})
    .transform(cm.stackX)
    .transform(cm.polar, {margin: 20, marginRight: 120})
    .add(cm.arc)
    .add(cm.legend, {anchor: "right"});
  root.render();
  // The disc is centered in the box from 20 to 280 and 20 to 280: radius 130, its right at 280.
  const [title] = Array.from(renderer.node().querySelectorAll("text"));
  assert.deepStrictEqual([+title.getAttribute("x"), +title.getAttribute("y")], [280 + 12, 20]);
  assert.ok(rects(renderer.node()).every((r) => +r.getAttribute("x") < 400));
});

// Renders a legend of a channel over the given values, in a margin of the given width, and returns
// the renderer's node.
function margin(values, channels, marginRight, plane = {}, anchor = "right") {
  const renderer = cm.svg({width: 400, height: 300});
  const root = cm.flow().renderer(renderer);
  root
    .data(values)
    .transform(cm.encode, {x: (d) => d.v, y: (d) => d.v, ...channels})
    .transform(cm.plane, {marginRight, x: {axis: null}, y: {axis: null}, ...plane})
    .add(cm.legend, {anchor});
  root.render();
  return renderer.node();
}

test("cm.legend aligns the labels at the ends of a ramp inward, so that they stay within it", () => {
  // At the top, from the left of the plot at 20, 240px wide.
  const node = margin([{v: 0}, {v: 10}], {fill: (d) => d.v}, 150, {}, "top");
  const ticks = Array.from(node.querySelectorAll("text")).filter((t) => /^\d+$/.test(t.textContent));
  assert.strictEqual(ticks[0].getAttribute("text-anchor"), "start");
  assert.strictEqual(ticks[ticks.length - 1].getAttribute("text-anchor"), "end");
  assert.strictEqual(+ticks[ticks.length - 1].getAttribute("x"), 20 + 240);
});

test("cm.legend places the ticks of a ramp through its scale, such as a log opacity", () => {
  const node = margin([{v: 1}, {v: 1000}], {fillOpacity: (d) => d.v}, 250, {fillOpacity: {type: "log"}}, "top");
  const x = (t) =>
    +Array.from(node.querySelectorAll("text"))
      .find((d) => d.textContent === t)
      .getAttribute("x");
  // 1, 10, 100 and 1000 are evenly spaced, as on a log axis.
  assertInDelta(x("10") - x("1"), x("100") - x("10"));
  assertInDelta(x("100") - x("10"), x("1k") - x("100"));
});

test("cm.legend places the ticks and colors of a ramp through its scale, such as a log color", () => {
  for (const anchor of ["top", "right"]) {
    const node = margin([{v: 1}, {v: 1000}], {fill: (d) => d.v}, 250, {fill: {type: "log"}}, anchor);
    const at = anchor === "top" ? "x" : "y";
    const position = (t) =>
      +Array.from(node.querySelectorAll("text"))
        .find((d) => d.textContent === t)
        .getAttribute(at);
    // 1, 10, 100 and 1000 are evenly spaced, as on a log axis.
    assertInDelta(position("10") - position("1"), position("100") - position("10"));
    assertInDelta(position("100") - position("10"), position("1k") - position("100"));
    // The slices, from the lowest values, are evenly spaced in the interpolator, so the middle one
    // is the middle color, of about 32, not of 500.
    const slices = rects(node);
    const fills = slices.map((r) => r.getAttribute("fill"));
    const n = fills.length;
    const i = Math.floor(n / 2);
    assert.strictEqual(fills[i], d3.rgb(d3.interpolateTurbo((i + 0.5) / n)).toString());
  }
});

test("cm.legend keeps sizes at the top within the chart, dropping the ticks in the middle", () => {
  // Mostly small values: the default range puts the largest radius at 30px, so 5,000 and 10,000
  // side by side are 110px wide, wider than the 97px left from the left of the plot at 300.
  const node = margin([{v: 1}, {v: 1}, {v: 1}, {v: 10000}], {r: (d) => d.v}, 20, {marginLeft: 300}, "top");
  const circles = Array.from(node.querySelectorAll("circle"));
  assert.strictEqual(circles.length, 1);
  for (const c of circles) assert.ok(+c.getAttribute("cx") + +c.getAttribute("r") <= 400);
});

test("cm.legend shortens swatch labels that are wider than the margin", () => {
  const node = margin([{v: 1, k: "Transportation and Utilities"}], {fill: (d) => d.k}, 100);
  const label = Array.from(node.querySelectorAll("text")).find((t) => t.textContent.startsWith("Transp"));
  assert.ok(label.textContent.endsWith("…"));
  assert.ok(+label.getAttribute("x") + widthOf(label.textContent) <= 400 + 1e-6);
});

test("cm.plane draws the legends of the scales given legend true, with their options", () => {
  const chart = (plane, add = (flow) => flow) => {
    const renderer = cm.svg({width: 400, height: 200});
    const root = cm.flow().renderer(renderer);
    add(
      root
        .data([
          {k: "a", v: 1},
          {k: "b", v: 4},
        ])
        .transform(cm.encode, {x: "v", y: "v", fill: "k", r: "v"})
        .transform(cm.plane, {marginRight: 150, x: {axis: null}, y: {axis: null}, ...plane}),
    );
    root.render();
    return texts(renderer.node());
  };
  // No legends unless asked, like Plot.
  assert.deepStrictEqual(chart(), []);
  assert.deepStrictEqual(chart({fill: {legend: true}}), ["k", "a", "b"]);
  assert.deepStrictEqual(chart({fill: {legend: true, tickFormat: (d) => d.toUpperCase()}}), ["k", "A", "B"]);
  assert.deepStrictEqual(
    chart({fill: {legend: true}}),
    chart({}, (flow) => flow.add(cm.legend, {r: false})),
  );
  // An explicit legend replaces the implicit ones, and takes their options.
  assert.deepStrictEqual(
    chart({fill: {legend: true, tickFormat: (d) => d.toUpperCase()}}, (flow) => flow.add(cm.legend, {r: false})),
    ["k", "A", "B"],
  );
  assert.deepStrictEqual(
    chart({fill: {legend: true}}, (flow) => flow.add(cm.legend, {fill: false, r: false})),
    [],
  );
});

test("cm.polar gives room to the legends at the top over its disc", () => {
  const renderer = cm.svg({width: 400, height: 300});
  const root = cm.flow().renderer(renderer);
  const [context] = root
    .data([
      {k: "a", v: 1},
      {k: "b", v: 2},
    ])
    .transform(cm.encode, {x: "v", fill: "k"})
    .transform(cm.stackX)
    .transform(cm.polar, {fill: {legend: true}})._values;
  root.render();
  // The title and the swatches, 3 + 14 + 14, and a gap of 10, over the margin of 40.
  const {cy, outerRadius} = context.frame;
  assertInDelta(cy - outerRadius, 3 + 14 + 14 + 10 + 40);
  const swatches = rects(renderer.node()).filter((r) => r.getAttribute("width") === "10");
  assert.ok(swatches.every((r) => +r.getAttribute("y") + 10 <= cy - outerRadius));
});

test("cm.legend balances the columns of swatches on the right, like CSS's columns", () => {
  const renderer = cm.svg({width: 400, height: 200});
  const root = cm.flow().renderer(renderer);
  root
    .data(["a", "b", "c", "d", "e"].map((k, i) => ({k, v: i})))
    .transform(cm.encode, {x: "v", y: "v", fill: "k"})
    // The frame is 10 to 80 tall: under the title, 14, four swatches fit per column.
    .transform(cm.plane, {marginRight: 150, marginBottom: 120, x: {axis: null}, y: {axis: null}})
    .add(cm.legend, {anchor: "right"});
  root.render();
  // Five swatches in two columns of three and two, rather than four and one.
  const columns = d3.rollup(
    rects(renderer.node()),
    (R) => R.length,
    (r) => r.getAttribute("x"),
  );
  assert.deepStrictEqual(Array.from(columns.values()), [3, 2]);
});

test("cm.polar starts its legends at the top at its left margin, as its top margin measures them", () => {
  // A wide chart, whose disc is centered far from the left: the swatches wrap at the width from the
  // left margin, as measured, and stay over the disc.
  const renderer = cm.svg({width: 640, height: 300});
  const root = cm.flow().renderer(renderer);
  const [context] = root
    .data(d3.range(60).map((i) => ({k: `category${String(i).padStart(2, "0")}`, v: 1})))
    .transform(cm.encode, {x: "v", fill: "k"})
    .transform(cm.stackX)
    .transform(cm.polar, {fill: {legend: true}})._values;
  root.render();
  const {cy, outerRadius} = context.frame;
  const swatches = rects(renderer.node()).filter((r) => r.getAttribute("width") === "10");
  assert.ok(swatches.every((r) => +r.getAttribute("x") >= 40));
  assert.ok(swatches.every((r) => +r.getAttribute("y") + 10 <= cy - outerRadius));
});

test("cm.legend fits the columns of swatches on the right, and the columns of legends, within the chart", () => {
  const renderer = cm.svg({width: 400, height: 160});
  const root = cm.flow().renderer(renderer);
  root
    .data(d3.range(12).map((i) => ({k: `Category number ${i}`, v: i})))
    .transform(cm.encode, {x: "v", y: "v", fill: "k", fillOpacity: "v"})
    .transform(cm.plane, {marginRight: 120, x: {axis: null}, y: {axis: null}})
    .add(cm.legend, {anchor: "right"});
  root.render();
  const node = renderer.node();
  // The two columns of swatches share the 105px left; with no room for a third column, the ramp is
  // under them.
  for (const r of rects(node)) assert.ok(+r.getAttribute("x") + +r.getAttribute("width") <= 400 + 1e-6);
  for (const t of node.querySelectorAll("text")) {
    if (t.getAttribute("text-anchor") === "end" || t.getAttribute("text-anchor") === "middle") continue;
    assert.ok(+t.getAttribute("x") + t.textContent.length * 6 <= 400 + 1e-6, t.textContent);
  }
});

test("cm.plane adds the legends at the top to a uniform margin, like cm.polar, unless marginTop is given", () => {
  const frameOf = (options) => {
    const renderer = cm.svg({width: 640, height: 400});
    const root = cm.flow().renderer(renderer);
    const [context] = root
      .data(d3.range(30).map((i) => ({k: `k${i}`, v: i})))
      .transform(cm.encode, {x: "v", y: "v", fill: "k"})
      .transform(cm.plane, {fill: {legend: true}, ...options})._values;
    root.render();
    const bottom = Math.max(...rects(renderer.node()).map((r) => +r.getAttribute("y") + +r.getAttribute("height")));
    return [context.frame.top, bottom];
  };
  const [top, legendBottom] = frameOf({margin: 30});
  assert.ok(top > legendBottom);
  assert.ok(top > 30);
  // A given marginTop comes first.
  assert.strictEqual(frameOf({margin: 30, marginTop: 30})[0], 30);
});

test("cm.plane keeps the title of y level, with room, when a legend asked has no scale, such as colors as they are", () => {
  const renderer = cm.svg({width: 400, height: 300});
  const root = cm.flow().renderer(renderer);
  root
    .data([
      {v: 1, c: "red"},
      {v: 2, c: "blue"},
    ])
    .transform(cm.encode, {x: "v", y: "v", fill: "c"})
    .transform(cm.plane, {fill: {legend: true}})
    .add(cm.circle, {r: 2});
  root.render();
  const title = Array.from(renderer.node().querySelectorAll("text")).find((t) => t.textContent === "↑ v");
  assert.strictEqual(title.getAttribute("transform"), null);
  assert.ok(+title.getAttribute("y") - 10 >= 0);
});

test("cm.plane starts the legends on the right past a given margin, which they add to", () => {
  const renderer = cm.svg({width: 400, height: 300});
  const root = cm.flow().renderer(renderer);
  root
    .data([
      {v: 1000, k: "aaaa"},
      {v: 2000, k: "b"},
    ])
    .transform(cm.encode, {x: "v", y: "v", fill: "k"})
    .transform(cm.plane, {margin: 30, y: {axis: "right"}, fill: {legend: "right"}})
    .add(cm.circle, {r: 2});
  root.render();
  // The legend ends 3px from the right of the chart.
  const label = Array.from(renderer.node().querySelectorAll("text")).find((t) => t.textContent === "aaaa");
  assertInDelta(+label.getAttribute("x") + widthOf("aaaa"), 400 - 3);
});

test("cm.legend balances the rows of swatches at the top, like the columns on the right", () => {
  const renderer = cm.svg({width: 400, height: 200});
  const root = cm.flow().renderer(renderer);
  const keys = ["a", "b", "c", "d", "e"];
  const row = (n) => keys.slice(0, n).reduce((w, k) => w + swatch(k), 0) + 12 * (n - 1);
  // The legend starts at the left of the plot, given so that four swatches fit a row, not five.
  const left = 400 - 3 - (row(4) + row(5)) / 2;
  root
    .data(keys.map((k, i) => ({k, v: i})))
    .transform(cm.encode, {x: "v", y: "v", fill: "k"})
    .transform(cm.plane, {marginLeft: left, x: {axis: null}, y: {axis: null}, fill: {legend: true}});
  root.render();
  // Five swatches in two rows of three and two, rather than four and one.
  const rows = d3.rollup(
    rects(renderer.node()),
    (R) => R.length,
    (r) => r.getAttribute("y"),
  );
  assert.deepStrictEqual(Array.from(rows.values()), [3, 2]);
});
