import {cumsum, group, InternMap, InternSet, max, min, range, sum} from "d3-array";
import {scaleBand} from "d3-scale";
import {orderOf, seriesOf, seriesOrder, withSeriesOrder} from "./series.js";

// Adapted from the stack transform of Observable Plot (ISC license): the rows of each group are
// stacked in order, with one running sum for negative values and one for the others. Rows
// without a value are skipped. Like Plot, the input order is kept unless an order is given, or the
// series have a domain from an earlier transform. An order given as the series, such as {order:
// ages}, is recorded as their domain, so that colors follow it.
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

// The extent of a stack: from its lowest value, or 0, to its highest value, or 0, as the outer end
// of a row, V2, is the farther from 0 for negative values too.
function extentOf(stack, V2) {
  let lo = 0;
  let hi = 0;
  for (const i of stack) {
    if (V2[i] < lo) lo = V2[i];
    if (V2[i] > hi) hi = V2[i];
  }
  return [lo, hi];
}

// The offsets of Plot's stack transform (ISC license). Normalize rescales each stack to [0, 1], such
// as the columns of a Marimekko chart.
function normalize(stacks, V2, V1) {
  for (const stack of stacks) {
    const [lo, hi] = extentOf(stack, V2);
    const k = 1 / (hi - lo || 1); // a stack of zeros stays at 0
    for (const i of stack) {
      V1[i] = k * (V1[i] - lo);
      V2[i] = k * (V2[i] - lo);
    }
  }
}

// Center aligns the middles of the stacks, such as the bars of a funnel; then the lowest baseline
// is put at 0.
function center(stacks, V2, V1) {
  for (const stack of stacks) {
    const [lo, hi] = extentOf(stack, V2);
    const m = (lo + hi) / 2;
    for (const i of stack) {
      V1[i] -= m;
      V2[i] -= m;
    }
  }
  zero(stacks, V2, V1);
}

// Wiggle shifts each stack, in order along the other position, to minimize the weighted change in
// the slopes of the series, like Byron and Wattenberg's streamgraph and d3's stackOffsetWiggle: the
// shift of a stack includes its own changes from the stack before, as in d3, where Plot's lags a
// stack behind; then the lowest baseline is put at 0.
function wiggle(stacks, V2, V1, Z) {
  const prev = new InternMap();
  let y = 0;
  for (const stack of stacks) {
    let j = -1;
    const F = stack.map((i) => Math.abs(V2[i] - V1[i]));
    const D = stack.map((i) => {
      j = Z ? Z[i] : ++j;
      const value = V2[i] - V1[i];
      const diff = prev.has(j) ? value - prev.get(j) : 0;
      prev.set(j, value);
      return diff;
    });
    const C = [0, ...cumsum(D)];
    const s = sum(F);
    if (s) y -= sum(F, (d, k) => (D[k] / 2 + C[k]) * d) / s;
    for (const i of stack) {
      V1[i] += y;
      V2[i] += y;
    }
  }
  zero(stacks, V2, V1);
}

function zero(stacks, V2, V1) {
  const m = min(stacks, (stack) => min(stack, (i) => V1[i]));
  for (const stack of stacks) {
    for (const i of stack) {
      V1[i] -= m;
      V2[i] -= m;
    }
  }
}

// Like Plot's facets, the contexts stacked with center or wiggle are shifted so that their middles
// line up, at the lowest of them.
function centerContexts(stacked) {
  if (stacked.length < 2) return;
  const middles = stacked.map(({I, V1, V2}) => (min(I, (i) => V1[i]) + max(I, (i) => V2[i])) / 2);
  const m0 = min(middles);
  for (let j = 0; j < stacked.length; j++) {
    const {I, V1, V2} = stacked[j];
    const p = m0 - middles[j];
    for (const i of I) {
      V1[i] += p;
      V2[i] += p;
    }
  }
}

// The offset of a stack by name, case-insensitive, with Plot's older names expand and silhouette.
function offsetOf(offset) {
  if (offset == null) return null;
  switch (`${offset}`.toLowerCase()) {
    case "normalize":
    case "expand":
      return normalize;
    case "center":
    case "silhouette":
      return center;
    case "wiggle":
      return wiggle;
  }
  return null;
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
// position (stacked bars), and offset, like Plot's: rescaled to [0, 1] with "normalize" (or
// "expand"), centered with "center" (or "silhouette"), such as a funnel, or flowing with "wiggle",
// such as a streamgraph. With chunk, they're wrapped in rows of chunk (waffles). Bands, such as x
// after cm.spreadX, are split among the series (grouped bars).
function stack(data, {chunk, padding = 0.1, order, reverse = false, offset} = {}, [key, key1, other, other1], name) {
  if (!data) throw new Error(`No channels: call flow.transform(cm.encode, channels) before cm.${name}.`);
  const offsetBy = offsetOf(offset);
  const stacked = [];
  const newData = data.map((context) => {
    const {value} = context;
    const {key: series, Z, domain: hinted} = seriesOf(context);
    const given = Array.isArray(order) ? order : undefined;
    const domain = given ?? hinted;
    const hints = given && Z ? withSeriesOrder(context.hints ?? {}, series, given) : (context.hints ?? {});
    if (hints[key]?.band) {
      if (!Z) return context;
      // Grouped bars: the bands are split among the series in their order.
      const [B, B1] = splitBands(value[key], value[key1], Z, domain ?? Array.from(new InternSet(Z)));
      return {...context, value: {...value, [key]: B, [key1]: B1}, hints};
    }
    const V = value[key];
    const O = value[other];
    const I = Array.from(V, (_, i) => i);
    const stacks = O ? Array.from(group(I, (i) => O[i]).values()) : [I];
    // Like Plot, the input order is kept unless an order is given, or the series have a domain.
    const compare = order != null ? orderOf(order, V, O, Z, value) : hinted && seriesOrder(Z, hinted);
    const arrange = (stack) => {
      if (compare) stack.sort(compare);
      if (reverse) stack.reverse();
    };
    if (chunk !== undefined) {
      // Columns split the band of the other position, if it has one, such as [x, x1] after a spread.
      const B1 = value[other1];
      const [V2, V1, C, C1, extent] = stackChunks(V, stacks, arrange, {chunk, padding}, B1 && O, B1);
      const columns = C ? {[other]: C, [other1]: C1} : {};
      // The domain spans the rows with their outer gaps and includes 0, unless one is recorded.
      const newHints = hints[key]?.domain ? hints : {...hints, [key]: {...hints[key], domain: extent}};
      return {...context, value: {...value, [key]: V2, [key1]: V1, ...columns}, hints: newHints};
    }
    const [V2, V1] = stackValues(V, stacks, arrange);
    if (offsetBy) offsetBy(stacks, V2, V1, Z);
    if (offsetBy === center || offsetBy === wiggle) stacked.push({I, V1, V2});
    return {...context, value: {...value, [key]: V2, [key1]: V1}, hints};
  });
  centerContexts(stacked);
  return newData;
}

// Stacks y: sums y per x for stacked columns, or splits the bands of cm.spreadY for grouped bars.
export function stackY(flow, data, options) {
  return stack(data, options, ["y", "y1", "x", "x1"], "stackY");
}

// Stacks x: sums x per y for stacked bars, or splits the bands of cm.spreadX for grouped columns.
export function stackX(flow, data, options) {
  return stack(data, options, ["x", "x1", "y", "y1"], "stackX");
}
