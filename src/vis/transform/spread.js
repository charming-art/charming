import {InternMap, InternSet, range, sort} from "d3-array";
import {scaleBand} from "d3-scale";
import {scaleFlex} from "./scales.js";
import {seriesOf, seriesOrder} from "./series.js";

function isNumeric(values) {
  return typeof values?.find((d) => d != null) === "number";
}

// Whether a position has been spread, into categories (band) or chunks.
function isSpread(hint) {
  return hint?.band !== undefined || hint?.chunk !== undefined;
}

function scaleOf(domain, {paddingInner, paddingOuter, align}) {
  return scaleBand(domain, [0, 1]).paddingInner(paddingInner).paddingOuter(paddingOuter).align(align);
}

// The categories of a channel, in order: sorted by default, like Plot; in the order of the rows
// with sort false; or by the max of a channel, such as "y", descending with a minus sign, such as
// "-y", like Plot's sort option. Categories without a value of that channel go last.
function categoriesOf(V, value, order) {
  const categories = new InternSet(V);
  if (order === false) return Array.from(categories);
  const sorted = sort(categories);
  if (order === undefined) return sorted;
  const descending = order.startsWith("-");
  const C = value[descending ? order.slice(1) : order];
  const max = new InternMap();
  for (let i = 0; i < V.length; i++) {
    const c = C?.[i];
    if (c == null) continue;
    const m = max.get(V[i]);
    if (m === undefined || c > m) max.set(V[i], c);
  }
  return sorted.sort((a, b) => {
    const ma = max.get(a);
    const mb = max.get(b);
    if (ma === undefined) return mb === undefined ? 0 : 1;
    if (mb === undefined) return -1;
    return descending ? mb - ma : ma - mb;
  });
}

// Places each category of the channel in a band of [0, 1] with a d3 band scale, ordered by the
// domain of its hint, else by the sort option. The other position, such as y, gets a baseline of 0
// if it's numeric and its y1 isn't bound, so that bars span from 0 to their values.
function spreadCategories(context, padding, flex, order, [key, key1, other, other1]) {
  const {[key]: V, [other]: O, [other1]: O1} = context.value;
  const {label, scale: name, domain = categoriesOf(V, context.value, order)} = context.hints?.[key] ?? {};
  // With flex, each category's band is proportional to the sum of the flex channel over its rows,
  // such as its number of rows, like G2's shareSize.
  const F = flex === undefined ? null : context.value[flex];
  const weights = F && weightsOf(domain, V, F);
  const scale = weights ? scaleFlex(domain, weights, padding) : scaleOf(domain, padding);
  const width = weights ? scale.width : () => scale.bandwidth();
  const V0 = V.map(scale);
  const value = {...context.value, [key]: V0, [key1]: V.map((v, i) => V0[i] + width(v))};
  if (O1 === undefined && isNumeric(O)) value[other1] = O.map(() => 0);
  // The bands are in [0, 1], so the outer padding is kept when fitted. The band is kept for axes,
  // which label the categories.
  const hint = {domain: [0, 1], band: {domain: scale.domain(), ...padding, ...(weights && {flex: weights})}};
  // The label and the name of the scale, if any, are kept.
  const kept = {...(label !== undefined && {label}), ...(name !== undefined && {scale: name})};
  return {...context, value, hints: {...context.hints, [key]: {...kept, ...hint}}};
}

// The weight of each category: the sum of its rows' values of the flex channel.
function weightsOf(domain, V, F) {
  const index = new InternMap(domain.map((d, i) => [d, i]));
  const weights = domain.map(() => 0);
  for (let i = 0; i < V.length; i++) {
    if (index.has(V[i])) weights[index.get(V[i])] += +F[i] || 0;
  }
  return weights;
}

// Places rows in slots by their position: chunk rows at a time, or one row per slot. The rows are
// grouped by the bands they already share, such as the band of an island, and ordered by series
// within each group, so that the slots of each group start at 0 and colors stay together. If the
// position was already spread, the slots subdivide each row's band, such as the units of a row
// inside the band of an island.
function spreadSlots(context, padding, chunk, [key, key1, other]) {
  const {value, hints = {}} = context;
  const nested = isSpread(hints[key]);
  const P = nested ? value[key] : null;
  const Q = isSpread(hints[other]) ? value[other] : null;
  const n = Object.values(value)[0].length; // all channels have one value per row
  const parents = new Map();
  for (let i = 0; i < n; i++) {
    const parent = `${P?.[i]},${Q?.[i]}`;
    if (parents.has(parent)) parents.get(parent).push(i);
    else parents.set(parent, [i]);
  }
  const {Z, domain} = seriesOf(context);
  const order = Z && seriesOrder(Z, domain);
  const S = new Array(n);
  let k = 0;
  for (const rows of parents.values()) {
    if (order) rows.sort(order);
    for (let position = 0; position < rows.length; position++) S[rows[position]] = Math.floor(position / chunk);
    k = Math.max(k, Math.ceil(rows.length / chunk));
  }
  const scale = scaleOf(range(k), padding);
  const start = (i) => (nested ? P[i] : 0);
  const size = (i) => (nested ? value[key1][i] - P[i] : 1);
  const V0 = S.map((s, i) => start(i) + size(i) * scale(s));
  const V1 = S.map((s, i) => V0[i] + size(i) * scale.bandwidth());
  const newValue = {...value, [key]: V0, [key1]: V1};
  // Chunks aren't categories, so a new spread of chunks records no band: on y, they're stacked up
  // from the baseline like values. A nested spread keeps the band of its parents for the axes.
  const name = hints[key]?.scale;
  const newHints = nested
    ? hints
    : {...hints, [key]: {...(name !== undefined && {scale: name}), domain: [0, 1], chunk}};
  return {...context, value: newValue, hints: newHints};
}

function spread(
  data,
  {padding = 0.1, paddingInner = padding, paddingOuter = padding, align = 0.5, chunk, flex, sort: order} = {},
  keys,
  name,
) {
  if (!data) throw new Error(`No channels: call flow.transform(cm.encode, channels) before cm.${name}.`);
  const options = {paddingInner, paddingOuter, align};
  return data.map((context) => {
    if (chunk === undefined && !isSpread(context.hints?.[keys[0]]))
      return spreadCategories(context, options, flex, order, keys);
    return spreadSlots(context, options, chunk ?? 1, keys);
  });
}

// Bands for the categories of x, such as the columns of a bar chart. With chunk, rows go into
// slots chunk at a time; spread again, x subdivides its bands, such as the units of a waffle row.
export function spreadX(flow, data, options) {
  return spread(data, options, ["x", "x1", "y", "y1"], "spreadX");
}

// Bands for the categories of y, such as the bars of a horizontal bar chart. With chunk, rows go
// into slots chunk at a time, such as the rows of a waffle.
export function spreadY(flow, data, options) {
  return spread(data, options, ["y", "y1", "x", "x1"], "spreadY");
}
