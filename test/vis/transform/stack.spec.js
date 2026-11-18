import assert from "node:assert";
import * as d3 from "d3";
import {test} from "vitest";
import "../../install-canvas-mock.js";
import * as cm from "../../../src/index.js";
import {assertInDelta, probe} from "../../helpers.js";

function values(data, channels, ...transforms) {
  let flow = cm.flow().data(data).transform(cm.encode, channels);
  for (const transform of transforms) flow = flow.transform(transform);
  return flow._values[0].value;
}

function assertAllInDelta(actual, expected) {
  assert.strictEqual(actual.length, expected.length);
  actual.forEach((d, i) => assertInDelta(d, expected[i]));
}

const data = [
  {state: "A", age: "a", n: 1},
  {state: "A", age: "b", n: 2},
  {state: "B", age: "a", n: 3},
];

test("cm.stackY sums y per x band in input order, for stacked columns", () => {
  const {y, y1} = values(data, {x: "state", y: "n", fill: "age"}, cm.spreadX, cm.stackY);
  assert.deepStrictEqual(y1, [0, 1, 0]);
  assert.deepStrictEqual(y, [1, 3, 3]);
});

test("cm.stackY stacks negative values down from 0, and skips rows without a value", () => {
  const rows = [2, -1, null, 3, -2, undefined].map((n) => ({n}));
  const {y, y1} = values(rows, {y: "n"}, cm.stackY);
  assert.deepStrictEqual(y1, [0, 0, NaN, 2, -1, NaN]);
  assert.deepStrictEqual(y, [2, -1, NaN, 5, -3, NaN]);
});

const stackYOf = (options) => (flow, data) => cm.stackY(flow, data, options);

test("cm.stackY orders the series by an order given as the series, and records it as their domain", () => {
  const flow = cm
    .flow()
    .data(data)
    .transform(cm.encode, {x: "state", y: "n", fill: "age"})
    .transform(cm.spreadX)
    .transform(cm.stackY, {order: ["b", "a"]});
  const [{value, hints}] = flow._values;
  assert.deepStrictEqual(value.y1, [2, 0, 0]);
  assert.deepStrictEqual(value.y, [3, 2, 3]);
  assert.deepStrictEqual(hints.fill.domain, ["b", "a"]);
});

test("cm.stackY uses z for the series before fill", () => {
  const flow = cm
    .flow()
    .data(data)
    .transform(cm.encode, {x: "state", y: "n", z: "age", fill: "age"})
    .transform(cm.spreadX)
    .transform(cm.stackY, {order: ["b", "a"]});
  const [{value, hints}] = flow._values;
  assert.deepStrictEqual(value.y1, [2, 0, 0]);
  // The order is the domain of z, not of fill, whose colors keep their own.
  assert.deepStrictEqual(hints.z.domain, ["b", "a"]);
  assert.strictEqual(hints.fill.domain, undefined);
});

test("cm.stackX sums x per y band, for stacked bars", () => {
  const {x, x1} = values(data, {y: "state", x: "n", fill: "age"}, cm.spreadY, cm.stackX);
  assert.deepStrictEqual(x1, [0, 1, 0]);
  assert.deepStrictEqual(x, [1, 3, 3]);
});

test("cm.stackX splits the x bands of cm.spreadX among the series, for grouped columns", () => {
  const {x, x1, y, y1} = values(data, {x: "state", y: "n", fill: "age"}, cm.spreadX, cm.stackX);
  const band = d3.scaleBand(["A", "B"], [0, 1]).padding(0.1);
  const w = band.bandwidth() / 2;
  // A series missing from a band keeps its slot: B has no "b", and its "a" takes the first half.
  assertAllInDelta(x, [band("A"), band("A") + w, band("B")]);
  assertAllInDelta(x1, [band("A") + w, band("A") + 2 * w, band("B") + w]);
  assert.deepStrictEqual(y, [1, 2, 3]);
  assert.deepStrictEqual(y1, [0, 0, 0]);
});

test("cm.stackY splits the y bands of cm.spreadY among the series, for grouped bars", () => {
  const {y, y1} = values(data, {y: "state", x: "n", fill: "age"}, cm.spreadY, stackYOf({order: ["b", "a"]}));
  const band = d3.scaleBand(["A", "B"], [0, 1]).padding(0.1);
  const w = band.bandwidth() / 2;
  assertAllInDelta(y, [band("A") + w, band("A"), band("B") + w]);
  assertAllInDelta(y1, [band("A") + 2 * w, band("A") + w, band("B") + 2 * w]);
});

test("cm.stackX and cm.stackY throw an error without channels", () => {
  assert.throws(() => cm.flow().data([1]).transform(cm.stackY), /No channels.*cm.stackY/);
  assert.throws(() => cm.flow().data([1]).transform(cm.stackX), /No channels.*cm.stackX/);
});

test("cm.stackY with chunk stacks equal values in rows of chunk, in data units", () => {
  const rows = Array.from({length: 5}, () => ({band: "A", n: 10}));
  const {y, y1, x, x1} = values(rows, {x: "band", y: "n"}, cm.spreadX, (flow, data) =>
    cm.stackY(flow, data, {chunk: 2, padding: 0}),
  );
  // Rows of 2 × 10 = 20 in data units: [0, 20], [0, 20], [20, 40], [20, 40], [40, 60].
  assert.deepStrictEqual(y1, [0, 0, 20, 20, 40]);
  assert.deepStrictEqual(y, [20, 20, 40, 40, 60]);
  // Columns are the two halves of the band of A.
  const band = d3.scaleBand(["A"], [0, 1]).padding(0.1);
  const w = band.bandwidth() / 2;
  assertAllInDelta(x, [band("A"), band("A") + w, band("A"), band("A") + w, band("A")]);
  assertAllInDelta(x1, [band("A") + w, band("A") + 2 * w, band("A") + w, band("A") + 2 * w, band("A") + w]);
});

test("cm.stackY with chunk stacks positive values up and negative values down, with gaps", () => {
  const rows = [10, -10, 10, -10, -10].map((n) => ({n}));
  const {y, y1} = values(rows, {y: "n"}, (flow, data) => cm.stackY(flow, data, {chunk: 2, padding: 0.5}));
  // Each row is 20 tall; padding 0.5 insets it by 5 on each side.
  assert.deepStrictEqual(y1, [5, -5, 5, -5, -25]);
  assert.deepStrictEqual(y, [15, -15, 15, -15, -35]);
});

test("cm.stackY with chunk keeps the other position if it has no band", () => {
  const rows = [
    {band: "A", n: 10},
    {band: "A", n: 10},
  ];
  const {x, x1, y} = values(rows, {x: "band", y: "n"}, (flow, data) => cm.stackY(flow, data, {chunk: 2, padding: 0}));
  assert.deepStrictEqual(x, ["A", "A"]);
  assert.strictEqual(x1, undefined);
  assert.deepStrictEqual(y, [20, 20]);
});

test("cm.stackY with chunk skips rows without a value", () => {
  const rows = [10, NaN, null, 10].map((n) => ({n}));
  const {y, y1} = values(rows, {y: "n"}, (flow, data) => cm.stackY(flow, data, {chunk: 2, padding: 0}));
  assert.deepStrictEqual(y1, [0, NaN, NaN, 0]);
  assert.deepStrictEqual(y, [20, NaN, NaN, 20]);
});

test("cm.stackY with chunk hints a domain from 0 that spans the rows with their gaps", () => {
  const stacked = (rows, options) =>
    cm
      .flow()
      .data(rows)
      .transform(cm.encode, {y: "n"})
      .transform((flow, data) => cm.stackY(flow, data, {chunk: 5, ...options}))._values[0].hints.y;
  assert.deepStrictEqual(stacked([10, 10, 10, 10, 10].map((n) => ({n}))).domain, [0, 50]);
  assert.deepStrictEqual(stacked([-10, -10, 10].map((n) => ({n}))).domain, [-50, 50]);
});

// Two x, three series: a = [1, 6], b = [3, 2], c = [2, 4].
const series = [
  {x: 0, k: "a", n: 1},
  {x: 0, k: "b", n: 3},
  {x: 0, k: "c", n: 2},
  {x: 1, k: "a", n: 6},
  {x: 1, k: "b", n: 2},
  {x: 1, k: "c", n: 4},
];

function ordered(options) {
  const {y, y1} = values(series, {x: "x", y: "n", fill: "k"}, (flow, data) => cm.stackY(flow, data, options));
  return {y, y1};
}

test("cm.stackY with order value sorts each stack by value, for ribbons", () => {
  // At x = 0: a, c, b; at x = 1: b, c, a.
  const {y1} = ordered({order: "value"});
  assert.deepStrictEqual(y1, [0, 3, 1, 6, 0, 2]);
});

test("cm.stackY with order sum orders the series by their totals", () => {
  // Totals: b = 5, c = 6, a = 7.
  const {y1} = ordered({order: "sum"});
  assert.deepStrictEqual(y1, [5, 0, 3, 6, 0, 2]);
});

test("cm.stackY with order appearance orders the series by the x of their maximum", () => {
  // Maxima: b at x = 0, a and c at x = 1, in order of appearance.
  const {y1} = ordered({order: "appearance"});
  assert.deepStrictEqual(y1, [3, 0, 4, 2, 0, 8]);
});

test("cm.stackY with order inside-out puts the earliest series in the middle", () => {
  const {y1} = ordered({order: "inside-out"});
  // Plot's order for this data: c, b, a.
  assert.deepStrictEqual(y1, [5, 2, 0, 6, 4, 0]);
});

test("cm.stackY takes an array of series as its order, and reverse", () => {
  assert.deepStrictEqual(ordered({order: ["c", "a", "b"]}).y1, [2, 3, 0, 4, 10, 0]);
  assert.deepStrictEqual(ordered({order: ["c", "a", "b"], reverse: true}).y1, [3, 0, 4, 2, 0, 8]);
  assert.deepStrictEqual(ordered({order: "-value"}).y1, ordered({order: "value", reverse: true}).y1);
});

test("cm.stackY keeps the input order without order", () => {
  assert.deepStrictEqual(ordered().y1, [0, 1, 4, 0, 6, 8]);
});

test("cm.stackY with order value sorts the rows around missing values", () => {
  const rows = [3, null, 1].map((n, i) => ({x: 0, k: `${i}`, n}));
  const {y1} = values(rows, {x: "x", y: "n", fill: "k"}, (flow, data) => cm.stackY(flow, data, {order: "value"}));
  assert.deepStrictEqual(y1, [1, NaN, 0]);
});

test("cm.stackY takes order names in any case, like Plot", () => {
  assert.deepStrictEqual(ordered({order: "Value"}).y1, ordered({order: "value"}).y1);
});

test("cm.stackY with offset normalize rescales each stack to [0, 1], like Plot", () => {
  const rows = [
    {x: 0, n: 1},
    {x: 0, n: 3},
    {x: 1, n: 2},
    {x: 1, n: 2},
  ];
  const {y, y1} = values(rows, {x: "x", y: "n"}, (flow, data) => cm.stackY(flow, data, {offset: "normalize"}));
  assert.deepStrictEqual(y1, [0, 0.25, 0, 0.5]);
  assert.deepStrictEqual(y, [0.25, 1, 0.5, 1]);
});

test("cm.stackY with offset normalize maps stacks with negative values to [0, 1] too", () => {
  const rows = [
    {x: 0, n: -1},
    {x: 0, n: 3},
  ];
  const {y, y1} = values(rows, {x: "x", y: "n"}, (flow, data) => cm.stackY(flow, data, {offset: "normalize"}));
  assert.deepStrictEqual(y1, [0.25, 0.25]);
  assert.deepStrictEqual(y, [0, 1]);
});

test("cm.stackY orders the series by a channel named by order, like Plot's field", () => {
  const rows = [
    {x: 0, k: "a", g: 2, n: 1},
    {x: 0, k: "b", g: 1, n: 1},
    {x: 0, k: "c", g: 3, n: 1},
  ];
  const by = (order, reverse) =>
    values(rows, {x: "x", y: "n", z: "k", g: "g"}, (flow, data) => cm.stackY(flow, data, {order, reverse})).y1;
  assert.deepStrictEqual(by("g"), [1, 0, 2]);
  assert.deepStrictEqual(by("g", true), [1, 2, 0]);
  assert.deepStrictEqual(by("-g"), [1, 2, 0]);
});

test("cm.stackY with offset normalize keeps a stack of zeros at 0, like Plot", () => {
  const rows = [
    {x: 0, n: 0},
    {x: 0, n: 0},
  ];
  const {y, y1} = values(rows, {x: "x", y: "n"}, (flow, data) => cm.stackY(flow, data, {offset: "normalize"}));
  assert.deepStrictEqual(y1, [0, 0]);
  assert.deepStrictEqual(y, [0, 0]);
});

test("cm.stackY takes expand for normalize, in any case, like Plot", () => {
  const rows = [{n: 1}, {n: 3}];
  for (const offset of ["expand", "Normalize", "EXPAND"]) {
    const {y} = values(rows, {y: "n"}, (flow, data) => cm.stackY(flow, data, {offset}));
    assert.deepStrictEqual(y, [0.25, 1]);
  }
});

test("cm.stackY resolves Plot's order names before channel names, like Plot", () => {
  const byValue = values(series, {x: "x", y: "n", fill: "k"}, (flow, data) => cm.stackY(flow, data, {order: "value"}));
  const named = values(series, {x: "x", y: "n", fill: "k", value: (d, i) => -i}, (flow, data) =>
    cm.stackY(flow, data, {order: "value"}),
  );
  assert.deepStrictEqual(named.y1, byValue.y1);
});

test("cm.stackY with an order leaves a constant fill unscaled", () => {
  const root = cm.flow().renderer(cm.svg({width: 100, height: 100}));
  const [context] = root
    .data(data)
    .transform(cm.encode, {x: "state", y: "n", fill: "steelblue"})
    .transform(cm.spreadX)
    .transform(cm.stackY, {order: ["steelblue"]})
    .transform(cm.plane)._values;
  assert.deepStrictEqual(context.value.fill, ["steelblue", "steelblue", "steelblue"]);
});

// Three dates of two series, a and b, stacked a then b.
const flows = [
  {x: 0, s: "a", v: 1},
  {x: 0, s: "b", v: 3},
  {x: 1, s: "a", v: 4},
  {x: 1, s: "b", v: 2},
  {x: 2, s: "a", v: 2},
  {x: 2, s: "b", v: 5},
];

test("cm.stackY with offset center centers each stack, then puts the lowest baseline at 0, like Plot", () => {
  const {y, y1} = values(flows, {x: "x", y: "v", z: "s"}, stackYOf({offset: "center"}));
  // The stacks are 4, 6 and 7 tall: centered on 0, then raised by 3.5, the half of the tallest.
  assert.deepStrictEqual(y1, [1.5, 2.5, 0.5, 4.5, 0, 2]);
  assert.deepStrictEqual(y, [2.5, 5.5, 4.5, 6.5, 2, 7]);
  // Silhouette is its older name.
  assert.deepStrictEqual(values(flows, {x: "x", y: "v", z: "s"}, stackYOf({offset: "silhouette"})).y1, y1);
});

test("cm.stackY with offset wiggle matches d3's stackOffsetWiggle, with the lowest baseline at 0", () => {
  const {y1} = values(flows, {x: "x", y: "v", z: "s"}, stackYOf({offset: "wiggle"}));
  const table = [0, 1, 2].map((x) => Object.fromEntries(flows.filter((d) => d.x === x).map((d) => [d.s, d.v])));
  const [a, b] = d3.stack().keys(["a", "b"]).offset(d3.stackOffsetWiggle)(table);
  const m = d3.min(a, (d) => d[0]);
  assertAllInDelta(y1, [a[0][0] - m, b[0][0] - m, a[1][0] - m, b[1][0] - m, a[2][0] - m, b[2][0] - m]);
});

test("cm.stackY with center or wiggle lines up the middles of its contexts, like the facets of Plot", () => {
  const [low, high] = cm
    .flow()
    .data([flows.slice(0, 2), flows.slice(2, 4)])
    .transform(cm.encode, {x: () => 0})
    .append(cm.g)
    .data((d) => d)
    .transform(cm.encode, {x: "x", y: "v", z: "s"})
    .transform((flow, data) => cm.stackY(flow, data, {offset: "center"}))._values;
  const middle = ({value: {y, y1}}) => (Math.min(...y1) + Math.max(...y)) / 2;
  assert.strictEqual(middle(low), middle(high));
});

test("cm.stackY with offset wiggle orders the series inside-out by default, like Plot, unless an order is given", () => {
  const wiggle = (options) => ordered({offset: "wiggle", ...options}).y1;
  // The same baselines as inside-out given explicitly, rather than the input order's.
  assert.deepStrictEqual(wiggle(), wiggle({order: "inside-out"}));
  assert.notDeepStrictEqual(wiggle(), wiggle({order: null}));
  // An order given wins, and null keeps the input order.
  assert.deepStrictEqual(wiggle({order: ["a", "b", "c"]}), wiggle({order: null}));
});

test("cm.stackY with offset wiggle stacks in order along x, whatever the order of the rows", () => {
  const sorted = values(flows, {x: "x", y: "v", z: "s"}, stackYOf({offset: "wiggle"}));
  const shuffled = [3, 0, 5, 1, 4, 2];
  const {y1} = values(
    shuffled.map((i) => flows[i]),
    {x: "x", y: "v", z: "s"},
    stackYOf({offset: "wiggle"}),
  );
  assertAllInDelta(
    y1,
    shuffled.map((i) => sorted.y1[i]),
  );
});

test("cm.stackY throws an error for an unknown offset, like Plot", () => {
  assert.throws(() => values(flows, {x: "x", y: "v", z: "s"}, stackYOf({offset: "wigle"})), /Unknown offset: wigle/);
});

// The enter delays and durations of rows after cm.stackEnter, or cm.stackExit, as cm.plane times
// them, with the options of the plane; before, a transform such as an earlier stack.
function timing(data, channels, options, transform = cm.stackEnter, {flow: flowOptions, plane = {}, before} = {}) {
  const [shape, calls] = probe();
  const root = cm.flow(flowOptions).renderer(cm.svg({width: 200, height: 200}));
  let flow = root.data(data).transform(cm.encode, channels);
  if (before) flow = flow.transform(...before);
  flow.transform(transform, options).transform(cm.plane, plane).add(shape);
  root.render();
  const stage = transform === cm.stackEnter ? "enter" : "exit";
  return [calls[0][`${stage}Delay`], calls[0][`${stage}Duration`]];
}

const fruits = [
  {year: 2001, fruit: "Apple"},
  {year: 2001, fruit: "Orange"},
  {year: 2002, fruit: "Apple"},
  {year: 2002, fruit: "Orange"},
];

test("cm.stackEnter enters the series one after another, gap apart, and their rows step apart", () => {
  const [delays, durations] = timing(fruits, {x: "year", fill: "fruit"}, {step: 100, gap: 200, duration: 300});
  // Apple's rows at 0 and 100, ending at 400; Orange's from 600, at 600 and 700.
  assert.deepStrictEqual(delays, [0, 600, 100, 700]);
  assert.deepStrictEqual(durations, [300, 300, 300, 300]);
});

test("cm.stackEnter groups by the channel given with by, or puts every row in one group with null", () => {
  const [byX] = timing(fruits, {x: "year", fill: "fruit"}, {by: "x", step: 100, gap: 200, duration: 300});
  assert.deepStrictEqual(byX, [0, 100, 600, 700]);
  const [all] = timing(fruits, {x: "year", fill: "fruit"}, {by: null, step: 100, duration: 300});
  assert.deepStrictEqual(all, [0, 100, 200, 300]);
});

test("cm.stackEnter orders the groups by order, or the domain of the series from an earlier stack, and reverse", () => {
  const [ordered] = timing(fruits, {fill: "fruit"}, {order: ["Orange", "Apple"], duration: 300});
  assert.deepStrictEqual(ordered, [300, 0, 300, 0]);
  const [reversed] = timing(fruits, {fill: "fruit"}, {reverse: true, duration: 300});
  assert.deepStrictEqual(reversed, [300, 0, 300, 0]);
  // The order of an earlier stack is the domain of the series.
  const [hinted] = timing(fruits, {x: "year", y: () => 1, fill: "fruit"}, {duration: 300}, cm.stackEnter, {
    before: [cm.stackY, {order: ["Orange", "Apple"]}],
  });
  assert.deepStrictEqual(hinted, [300, 0, 300, 0]);
});

test("cm.stackEnter takes the durations of rows, and adds to their delays, in milliseconds", () => {
  const data = [
    {fruit: "Apple", d: 100, t: 50},
    {fruit: "Apple", d: 500, t: 0},
    {fruit: "Orange", d: 100, t: 0},
  ];
  const [delays, durations] = timing(data, {fill: "fruit", enterDuration: "d", enterDelay: "t"}, {step: 100});
  // Apple ends with its second row, at 100 + 500; Orange starts there.
  assert.deepStrictEqual(durations, [100, 500, 100]);
  assert.deepStrictEqual(delays, [50, 100, 600]);
});

test("cm.stackEnter lasts the flow's duration by default, else 750ms like transitions", () => {
  const [, durations] = timing(fruits, {fill: "fruit"}, {}, cm.stackEnter, {flow: {transition: {duration: 400}}});
  assert.deepStrictEqual(durations, [400, 400, 400, 400]);
  const [, defaults] = timing(fruits, {fill: "fruit"}, {});
  assert.deepStrictEqual(defaults, [750, 750, 750, 750]);
});

test("cm.stackExit stacks the exits of rows along time", () => {
  const [delays, durations] = timing(fruits, {fill: "fruit"}, {duration: 300}, cm.stackExit);
  assert.deepStrictEqual(delays, [0, 300, 0, 300]);
  assert.deepStrictEqual(durations, [300, 300, 300, 300]);
});

test("cm.stackEnter steps and gaps in milliseconds, which the options of the time scale don't rescale", () => {
  const plain = timing(fruits, {fill: "fruit"}, {by: null, step: 100, duration: 300});
  for (const time of [
    {range: [0, 1000]},
    {type: "linear", range: [0, 1000]},
    {range: [0, 1000], transform: (d) => d * 10},
    {percent: true, range: [0, 1000]},
  ]) {
    assert.deepStrictEqual(
      timing(fruits, {fill: "fruit"}, {by: null, step: 100, duration: 300}, cm.stackEnter, {plane: {time}}),
      plain,
    );
  }
});

test("cm.stackEnter steps the encoded delays and durations once the time scale has scaled them", () => {
  const tasks = [
    {start: 1, length: 3},
    {start: 3, length: 10},
  ];
  const channels = {enterDelay: "start", enterDuration: "length"};
  const [delays, durations] = timing(tasks, channels, {by: null, step: 100}, cm.stackEnter, {
    plane: {time: {range: [0, 1000]}},
  });
  // From 0 to 10 over 1000ms: the starts at 100 and 300, the second 100ms later by its rank.
  assert.deepStrictEqual(delays, [100, 400]);
  assert.deepStrictEqual(durations, [300, 1000]);
});
