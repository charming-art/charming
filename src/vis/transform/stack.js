import {greatest, group, groupSort, InternMap, InternSet, range, rollup, sum} from "d3-array";
import {scaleBand} from "d3-scale";
import {seriesOf, seriesOrder} from "./series.js";

// Adapted from the stack transform of Observable Plot (ISC license): the rows of each group are
// stacked in order, with one running sum for negative values and one for the others. Rows
// without a value are skipped. Like Plot, the input order is kept unless an order is given,
// here the domain of the series from its hint.
function stackValues(V, stacks, arrange) {
  const n = V.length;
  const V1 = new Array(n).fill(NaN);
  const V2 = new Array(n).fill(NaN);
  for (const stack of stacks) {
    arrange(stack);
    let vn = 0;
    let vp = 0;
    for (const i of stack) {
      const v = V[i];
      if (v == null) continue; // null would otherwise count as 0, as in null >= 0
      if (v < 0) vn = V2[i] = (V1[i] = vn) + v;
      else if (v >= 0) vp = V2[i] = (V1[i] = vp) + v;
    }
  }
  return [V2, V1];
}

// Stacks equal values, such as the units of cm.unitY, in rows of chunk, like the cells of Plot's
// waffle: row r of a stack spans [r, r + 1] × chunk × |value| in data units, with its sign, so
// that positive values go up and negative values go down. Within its row, a value takes one of
// chunk columns of its band on the other position, such as [x, x1]. Rows and columns are inset by
// padding, so that the cells have gaps.
function stackChunks(V, stacks, arrange, {chunk, padding}, B, B1) {
  const n = V.length;
  const V1 = new Array(n).fill(NaN);
  const V2 = new Array(n).fill(NaN);
  const C = B && new Array(n).fill(NaN);
  const C1 = B && new Array(n).fill(NaN);
  const columns = scaleBand(range(chunk), [0, 1]).padding(padding);
  // The extent of the rows without their insets, from 0, for the domain of the position.
  let lo = 0;
  let hi = 0;
  for (const stack of stacks) {
    arrange(stack);
    let kn = 0;
    let kp = 0;
    for (const i of stack) {
      const v = V[i];
      if (v == null || isNaN(v)) continue; // rows without a value take no cell
      const k = v < 0 ? kn++ : kp++;
      const sign = v < 0 ? -1 : 1;
      const r = Math.floor(k / chunk);
      const h = chunk * Math.abs(v);
      const inset = (h * padding) / 2;
      V1[i] = sign * (r * h + inset);
      V2[i] = sign * ((r + 1) * h - inset);
      if (sign < 0) lo = Math.min(lo, -(r + 1) * h);
      else hi = Math.max(hi, (r + 1) * h);
      if (!B) continue;
      const w = B1[i] - B[i];
      C[i] = B[i] + w * columns(k % chunk);
      C1[i] = C[i] + w * columns.bandwidth();
    }
  }
  return [V2, V1, C, C1, [lo, hi]];
}

// Like Plot, missing values, such as null or NaN, are ordered last either way.
function defined(d) {
  return d != null && d >= d;
}

function ascendingDefined(a, b) {
  return !defined(a) - !defined(b) || (a < b ? -1 : a > b ? 1 : 0);
}

function descendingDefined(a, b) {
  return !defined(a) - !defined(b) || (a < b ? 1 : a > b ? -1 : 0);
}

// The orders of Plot's stack transform (ISC license): by value within each stack, or a series
// order shared by all stacks, by sum, appearance, inside-out or as given. A "-" prefix descends,
// and names are case-insensitive, as in Plot.
function orderOf(order, V, O, Z, value) {
  if (order == null) return null;
  if (Array.isArray(order)) return orderSeries(ascendingDefined, Z, () => order);
  // A name of a bound channel orders the rows by it, like a field in Plot, such as {order: "fill"}.
  const name = `${order}`.replace(/^-/, "");
  if (Object.hasOwn(value, name)) {
    const C = value[name];
    const compare = `${order}`.startsWith("-") ? descendingDefined : ascendingDefined;
    return (i, j) => compare(C[i], C[j]);
  }
  order = `${order}`.toLowerCase();
  const descend = order.startsWith("-");
  const compare = descend ? descendingDefined : ascendingDefined;
  const I = range(V.length);
  const X = O ?? I;
  const appearance = () =>
    groupSort(
      I,
      (G) => X[greatest(G, (i) => V[i])],
      (i) => Z[i],
    );
  switch (descend ? order.slice(1) : order) {
    case "value":
      return (i, j) => compare(V[i], V[j]);
    case "z":
      return (i, j) => compare(Z[i], Z[j]);
    case "sum":
      return orderSeries(compare, Z, () =>
        groupSort(
          I,
          (G) => sum(G, (i) => V[i]),
          (i) => Z[i],
        ),
      );
    case "appearance":
      return orderSeries(compare, Z, appearance);
    case "inside-out":
      return orderSeries(compare, Z, () => {
        const sums = rollup(
          I,
          (G) => sum(G, (i) => V[i]),
          (i) => Z[i],
        );
        const Kp = [];
        const Kn = [];
        let s = 0;
        for (const k of appearance()) {
          if (s < 0) ((s += sums.get(k)), Kp.push(k));
          else ((s -= sums.get(k)), Kn.push(k));
        }
        return Kn.reverse().concat(Kp);
      });
  }
  return null;
}

// Like Plot's normalize offset, rescales each stack to [0, 1]: from its lowest value, or 0, to its
// highest value, or 0, such as the columns of a Marimekko chart.
function normalize(stacks, V2, V1) {
  for (const stack of stacks) {
    let lo = 0;
    let hi = 0;
    for (const i of stack) {
      if (V2[i] < lo) lo = V2[i];
      if (V2[i] > hi) hi = V2[i];
    }
    const k = 1 / (hi - lo);
    for (const i of stack) {
      V1[i] = k * (V1[i] - lo);
      V2[i] = k * (V2[i] - lo);
    }
  }
}

// A series order shared by all stacks, from a domain of the series.
function orderSeries(compare, Z, domain) {
  if (!Z) return null;
  const index = new InternMap(domain().map((d, i) => [d, i]));
  return (i, j) => compare(index.get(Z[i]), index.get(Z[j]));
}

// Splits the band of each row, such as [x, x1], among the series, so that they sit side by side.
// A series missing from a band keeps its slot, so that the series line up across bands.
function splitBands(B, B1, Z, domain) {
  const index = new InternMap(domain.map((d, i) => [d, i]));
  const m = domain.length;
  const at = (i, k) => B[i] + ((B1[i] - B[i]) * k) / m;
  return [B.map((_, i) => at(i, index.get(Z[i]))), B.map((_, i) => at(i, index.get(Z[i]) + 1))];
}

// Stacks along a position. Values, such as y in a column chart, are summed per group of the other
// position (stacked bars), rescaled to [0, 1] with offset "normalize", or with chunk, wrapped in
// rows of chunk (waffles). Bands, such as x after cm.spreadX, are split among the series (grouped
// bars).
function stack(data, {chunk, padding = 0.1, order, reverse = false, offset} = {}, [key, key1, other, other1], name) {
  if (!data) throw new Error(`No channels: call flow.transform(cm.encode, channels) before cm.${name}.`);
  return data.map((context) => {
    const {value, hints = {}} = context;
    const {Z, domain} = seriesOf(context);
    if (hints[key]?.band) {
      if (!Z) return context;
      const [B, B1] = splitBands(value[key], value[key1], Z, domain ?? Array.from(new InternSet(Z)));
      return {...context, value: {...value, [key]: B, [key1]: B1}};
    }
    const V = value[key];
    const O = value[other];
    const I = Array.from(V, (_, i) => i);
    const stacks = O ? Array.from(group(I, (i) => O[i]).values()) : [I];
    // Like Plot, the input order is kept unless an order is given, or the series have a domain.
    const compare = order != null ? orderOf(order, V, O, Z, value) : domain && seriesOrder(Z, domain);
    const arrange = (stack) => {
      if (compare) stack.sort(compare);
      if (reverse) stack.reverse();
    };
    if (chunk !== undefined) {
      // Columns split the band of the other position, if it has one, such as [x, x1] after a spread.
      const B1 = value[other1];
      const [V2, V1, C, C1, extent] = stackChunks(V, stacks, arrange, {chunk, padding}, B1 && O, B1);
      const columns = C ? {[other]: C, [other1]: C1} : {};
      // The domain spans the rows with their outer gaps and includes 0, unless one is given.
      const newHints = hints[key]?.domain ? hints : {...hints, [key]: {...hints[key], domain: extent}};
      return {...context, value: {...value, [key]: V2, [key1]: V1, ...columns}, hints: newHints};
    }
    const [V2, V1] = stackValues(V, stacks, arrange);
    if (offset === "normalize") normalize(stacks, V2, V1);
    return {...context, value: {...value, [key]: V2, [key1]: V1}};
  });
}

// Stacks y: sums y per x for stacked columns, or splits the bands of cm.spreadY for grouped bars.
export function stackY(flow, data, options) {
  return stack(data, options, ["y", "y1", "x", "x1"], "stackY");
}

// Stacks x: sums x per y for stacked bars, or splits the bands of cm.spreadX for grouped columns.
export function stackX(flow, data, options) {
  return stack(data, options, ["x", "x1", "y", "y1"], "stackX");
}
