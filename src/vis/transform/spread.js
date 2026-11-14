import {InternSet, range, sort} from "d3-array";
import {scaleBand} from "d3-scale";
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

// Places each category of the channel in a band of [0, 1] with a d3 band scale, ordered by the
// domain of its hint, else sorted. The other position, such as y, gets a baseline of 0 if it's
// numeric and its y1 isn't bound, so that bars span from 0 to their values.
function spreadCategories(context, padding, [key, key1, other, other1]) {
  const {[key]: V, [other]: O, [other1]: O1} = context.value;
  const {label, domain = sort(new InternSet(V))} = context.hints?.[key] ?? {};
  const scale = scaleOf(domain, padding);
  const V0 = V.map(scale);
  const value = {...context.value, [key]: V0, [key1]: V0.map((v) => v + scale.bandwidth())};
  if (O1 === undefined && isNumeric(O)) value[other1] = O.map(() => 0);
  // The bands are in [0, 1], so the outer padding is kept when fitted. The band is kept for axes,
  // which label the categories.
  const hint = {domain: [0, 1], band: {domain: scale.domain(), ...padding}};
  return {...context, value, hints: {...context.hints, [key]: label === undefined ? hint : {label, ...hint}}};
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
    rows.forEach((i, position) => (S[i] = Math.floor(position / chunk)));
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
  const newHints = nested ? hints : {...hints, [key]: {domain: [0, 1], chunk}};
  return {...context, value: newValue, hints: newHints};
}

function spread(
  data,
  {padding = 0.1, paddingInner = padding, paddingOuter = padding, align = 0.5, chunk} = {},
  keys,
  name,
) {
  if (!data) throw new Error(`No channels: call flow.transform(cm.encode, channels) before cm.${name}.`);
  const options = {paddingInner, paddingOuter, align};
  return data.map((context) => {
    if (chunk === undefined && !isSpread(context.hints?.[keys[0]])) return spreadCategories(context, options, keys);
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
