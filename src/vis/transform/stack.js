import {group, InternMap, InternSet, range} from "d3-array";
import {scaleBand} from "d3-scale";
import {seriesOf, seriesOrder} from "./series.js";

// Adapted from the stack transform of Observable Plot (ISC license): the rows of each group are
// stacked in order, with one running sum for negative values and one for the others. Rows
// without a value are skipped. Like Plot, the input order is kept unless an order is given,
// here the domain of the series from its hint.
function stackValues(V, stacks, order) {
  const n = V.length;
  const V1 = new Array(n).fill(NaN);
  const V2 = new Array(n).fill(NaN);
  for (const stack of stacks) {
    if (order) stack.sort(order);
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
function stackChunks(V, stacks, order, {chunk, padding}, B, B1) {
  const n = V.length;
  const V1 = new Array(n).fill(NaN);
  const V2 = new Array(n).fill(NaN);
  const C = B && new Array(n).fill(NaN);
  const C1 = B && new Array(n).fill(NaN);
  const columns = scaleBand(range(chunk), [0, 1]).padding(padding);
  for (const stack of stacks) {
    if (order) stack.sort(order);
    let kn = 0;
    let kp = 0;
    for (const i of stack) {
      const v = V[i];
      if (v == null) continue;
      const k = v < 0 ? kn++ : kp++;
      const sign = v < 0 ? -1 : 1;
      const r = Math.floor(k / chunk);
      const h = chunk * Math.abs(v);
      const inset = (h * padding) / 2;
      V1[i] = sign * (r * h + inset);
      V2[i] = sign * ((r + 1) * h - inset);
      if (!B) continue;
      const w = B1[i] - B[i];
      C[i] = B[i] + w * columns(k % chunk);
      C1[i] = C[i] + w * columns.bandwidth();
    }
  }
  return [V2, V1, C, C1];
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
// position (stacked bars), or with chunk, wrapped in rows of chunk (waffles). Bands, such as x
// after cm.spreadX, are split among the series (grouped bars).
function stack(data, {chunk, padding = 0.1} = {}, [key, key1, other, other1], name) {
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
    // Like Plot, the input order is kept unless the series have a domain.
    const order = domain && seriesOrder(Z, domain);
    if (chunk !== undefined) {
      // Columns split the band of the other position, if it has one, such as [x, x1] after a spread.
      const B1 = value[other1];
      const [V2, V1, C, C1] = stackChunks(V, stacks, order, {chunk, padding}, B1 && O, B1);
      const columns = C ? {[other]: C, [other1]: C1} : {};
      return {...context, value: {...value, [key]: V2, [key1]: V1, ...columns}};
    }
    const [V2, V1] = stackValues(V, stacks, order);
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
