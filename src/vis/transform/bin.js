import {
  bin as binner,
  bisectRight,
  extent,
  thresholdFreedmanDiaconis,
  thresholdScott,
  thresholdSturges,
} from "d3-array";
import {groupsOf, indexOf, reduceGroups, seriesKey} from "./reduce.js";

// Like Plot, auto is Scott's rule, with at most 200 bins.
const thresholdFunctions = {
  auto: (V, min, max) => Math.min(200, thresholdScott(V, min, max)),
  scott: thresholdScott,
  sturges: thresholdSturges,
  "freedman-diaconis": thresholdFreedmanDiaconis,
};

// The bins of the values: their edges, and the bin of a value, or -1 for none. With an interval,
// the bins start at its multiples; each value is snapped to a step if it's within floating-point
// error of one, so that 0.3 starts a bin of 0.1 rather than ending the one before. Otherwise they're
// the bins of d3's bin for the thresholds: a count, an array, or the name of a rule.
function binsOf(V, {thresholds = "auto", interval}) {
  const [lo, hi] = extent(V);
  if (lo === undefined) return {edges: [], binOf: () => -1};
  if (interval !== undefined) {
    const step = (v) => {
      const k = v / interval;
      const r = Math.round(k);
      return Math.abs(k - r) < 1e-6 ? r : Math.floor(k);
    };
    const start = step(lo);
    const stop = step(hi) + 1;
    const edges = Array.from({length: stop - start + 1}, (_, i) => +((start + i) * interval).toPrecision(15));
    return {edges, binOf: (v) => (v == null || isNaN(v) ? -1 : step(v) - start)};
  }
  const threshold = typeof thresholds === "string" ? thresholdFunctions[thresholds.toLowerCase()] : thresholds;
  if (threshold === undefined) throw new Error(`Unknown thresholds: ${thresholds}.`);
  // d3 adds a collapsed bin for a maximum at a threshold, such as [10, 10]; it's in the last bin.
  // Values that are all the same are in one collapsed bin, like Plot.
  const bins = binner().thresholds(threshold)(V);
  const unique = Array.from(new Set([bins[0].x0, ...bins.map((b) => b.x1)]));
  const edges = unique.length === 1 ? [lo, lo] : unique;
  return {edges, binOf: (v) => binOf(edges, v)};
}

// The bin of a value among edges: bins include their lower edge, and the last one also its upper
// edge, like d3's bin. Values outside the edges, or missing, are in no bin.
function binOf(E, v) {
  if (v == null || !(v >= E[0] && v <= E[E.length - 1])) return -1;
  return Math.min(bisectRight(E, v) - 1, E.length - 2);
}

// Adapted from the bin transform of Observable Plot (ISC license): bins the rows on the positions
// in keys, such as x, and groups them by the other position, if it's bound and isn't an output, and
// by series. Each non-empty bin becomes one row, with outputs such as {y: "count"} and its edges in
// the position and its pair, such as x and x1. The edges are shared by all the contexts, so that
// facets compare. An output on a position gets a baseline of 0 in its pair, such as y1, so that
// bars span from 0 to their values; a stack transform replaces both.
function binOn(data, options, defaults, keys, name) {
  if (!data) throw new Error(`No channels: call flow.transform(cm.encode, channels) before cm.${name}.`);
  const {thresholds, interval, ...rest} = options;
  const outputs = Object.keys(rest).length ? rest : defaults;
  // The binned positions hold the edges of the bins, so they can't be outputs.
  for (const key of keys) {
    if (key in outputs || `${key}1` in outputs)
      throw new Error(`cm.${name} bins ${key}, so ${key} can't be an output.`);
  }
  const bins = keys.map((key) =>
    binsOf(
      data.flatMap((context) => indexOf(context).map((i) => context.value[key][i])),
      {thresholds, interval},
    ),
  );
  return data.map((context) => {
    const {value} = context;
    const other = ["x", "y"].filter((key) => !keys.includes(key) && key in value && !(key in outputs));
    const z = seriesKey(value, outputs);
    const by = [...other, ...(z ? [z] : [])];
    const B = keys.map((key, k) => Array.from(value[key], bins[k].binOf));
    const I = indexOf(context).filter((i) => B.every((b) => b[i] >= 0));
    // Bins within each group, in ascending order.
    const groups = groupsOf(
      I,
      by.map((key) => value[key]),
    ).flatMap((J) =>
      groupsOf(
        J.sort((i, j) => compareBins(B, i, j)),
        B,
      ),
    );
    const fields = {};
    for (let k = 0; k < keys.length; k++) {
      const key = keys[k];
      fields[key] = groups.map((J) => bins[k].edges[B[k][J[0]]]);
      fields[`${key}1`] = groups.map((J) => bins[k].edges[B[k][J[0]] + 1]);
    }
    for (const key of ["x", "y"]) {
      if (key in outputs && !keys.includes(key) && !(`${key}1` in outputs)) fields[`${key}1`] = groups.map(() => 0);
    }
    return reduceGroups(context, groups, by, outputs, fields);
  });
}

function compareBins(B, i, j) {
  for (const b of B) if (b[i] !== b[j]) return b[i] - b[j];
  return 0;
}

// Bins the rows on x, such as the bars of a histogram, with counts in y by default.
export function binX(flow, data, options = {}) {
  return binOn(data, options, {y: "count"}, ["x"], "binX");
}

// Bins the rows on y, such as the bars of a horizontal histogram, with counts in x by default.
export function binY(flow, data, options = {}) {
  return binOn(data, options, {x: "count"}, ["y"], "binY");
}

// Bins the rows on x and y, such as the cells of a binned heatmap, with counts in fill by default.
export function bin(flow, data, options = {}) {
  return binOn(data, options, {fill: "count"}, ["x", "y"], "bin");
}
