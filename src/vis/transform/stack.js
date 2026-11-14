import {ascending, group, InternMap, InternSet} from "d3-array";

// Like Plot, the series of a row is its z, else its fill, else its stroke.
function seriesKey(value) {
  return ["z", "fill", "stroke"].find((key) => key in value);
}

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

// Splits the band of each row, such as [x, x1], among the series, so that they sit side by side.
// A series missing from a band keeps its slot, so that the series line up across bands.
function splitBands(B, B1, Z, domain) {
  const index = new InternMap(domain.map((d, i) => [d, i]));
  const m = domain.length;
  const at = (i, k) => B[i] + ((B1[i] - B[i]) * k) / m;
  return [B.map((_, i) => at(i, index.get(Z[i]))), B.map((_, i) => at(i, index.get(Z[i]) + 1))];
}

// Stacks along a position. Values, such as y in a column chart, are summed per group of the other
// position (stacked bars). Bands, such as x after cm.spreadX, are split among the series
// (grouped bars).
function stack(data, [key, key1, other], name) {
  if (!data) throw new Error(`No channels: call flow.transform(cm.encode, channels) before cm.${name}.`);
  return data.map((context) => {
    const {value, hints = {}} = context;
    const zKey = seriesKey(value);
    const Z = zKey && value[zKey];
    const domain = Z && hints[zKey]?.domain;
    if (hints[key]?.band) {
      if (!Z) return context;
      const [B, B1] = splitBands(value[key], value[key1], Z, domain ?? Array.from(new InternSet(Z)));
      return {...context, value: {...value, [key]: B, [key1]: B1}};
    }
    const V = value[key];
    const O = value[other];
    const I = Array.from(V, (_, i) => i);
    const stacks = O ? Array.from(group(I, (i) => O[i]).values()) : [I];
    const index = domain && new InternMap(domain.map((d, i) => [d, i]));
    const order = index && ((i, j) => ascending(index.get(Z[i]), index.get(Z[j])));
    const [V2, V1] = stackValues(V, stacks, order);
    return {...context, value: {...value, [key]: V2, [key1]: V1}};
  });
}

// Stacks y: sums y per x for stacked columns, or splits the bands of cm.spreadY for grouped bars.
export function stackY(flow, data) {
  return stack(data, ["y", "y1", "x"], "stackY");
}

// Stacks x: sums x per y for stacked bars, or splits the bands of cm.spreadX for grouped columns.
export function stackX(flow, data) {
  return stack(data, ["x", "x1", "y"], "stackX");
}
