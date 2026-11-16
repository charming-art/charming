import {InternMap, InternSet, max, min, sort} from "d3-array";
import {scaleBand, scaleLinear, scalePoint, scaleSequential, scaleUtc} from "d3-scale";
import * as chromatic from "d3-scale-chromatic";
import {discrete, domainOf} from "../../core/transform/scale.js";
import {isColor} from "../color.js";
import {seriesOf} from "./series.js";
import {schemeCategory} from "../scheme.js";

// The scales shared by cm.plane and cm.polar.
const colorKeys = ["fill", "stroke"];

function isNumeric(values) {
  return typeof values.find((d) => d != null) === "number";
}

// Like Plot, values that are already colors aren't scaled, and neither are objects such as
// the cells of the terminal renderer, {ch, fg}.
function isIdentity(values) {
  const v = values.find((d) => d != null);
  if (typeof v === "object" && !(v instanceof Date)) return true;
  return values.every((d) => d == null || (typeof d === "string" && isColor(d)));
}

// The hints are resolved by cm.plane, so its contexts don't keep them.
export function withoutHints(context) {
  const newContext = {...context};
  delete newContext.hints;
  return newContext;
}

// A resolved scale, such as {type: "linear", domain: [0, 10], range: [0, 100]}, for axes and legends.
export function resolve({type, domain, range}) {
  if (typeof type !== "function") return {type, domain, range};
  const s = type.copy().domain(domain);
  if (range !== undefined) s.range(range);
  return {type: s, domain, range: s.range()};
}

// The interpolators of d3-scale-chromatic by scheme name, case-insensitive like Plot's schemes.
const interpolators = new Map(
  Object.entries(chromatic)
    .filter(([name]) => name.startsWith("interpolate"))
    .map(([name, interpolate]) => [name.slice("interpolate".length).toLowerCase(), interpolate]),
);

function interpolatorOf(scheme) {
  const interpolate = interpolators.get(`${scheme}`.toLowerCase());
  if (!interpolate) throw new Error(`Unknown scheme: ${scheme}.`);
  return interpolate;
}

// The scales of the hinted color channels: categorical by default, and sequential for numbers or
// a linear type, like Plot, through the scheme's interpolator ("turbo" by default) or the range's
// colors. Missing numbers have no color.
export function colorScales(value, hints) {
  const scales = {};
  for (const key of colorKeys) {
    if (!(key in hints) || !(key in value)) continue;
    const {type, domain, range, scheme = "turbo"} = hints[key];
    const V = value[key];
    if (type === undefined && domain === undefined && range === undefined && isIdentity(V)) continue;
    if (type === "linear" || (type === undefined && isNumeric(V))) {
      const sequential = range === undefined ? scaleSequential(interpolatorOf(scheme)) : scaleLinear();
      scales[key] = {type: sequential, domain: domain ?? [min(V), max(V)], range};
      continue;
    }
    const ordinal = type === undefined || type === "ordinal";
    scales[key] = {
      type: type ?? "ordinal",
      domain: domain ?? (ordinal ? sort(new InternSet(V)) : domainOf(type, V)),
      range: range ?? (ordinal ? schemeCategory : undefined),
    };
  }
  return scales;
}

// The color scales as descriptors of core cm.scale, which names the type of a scale "scale".
export function scaleDescriptors(scales) {
  return Object.fromEntries(Object.entries(scales).map(([key, {type, ...scale}]) => [key, {scale: type, ...scale}]));
}

function isTemporal(values) {
  return values.find((d) => d != null) instanceof Date;
}

// The scale shared by position channels such as x and x1, with the domain inferred from all of them.
// The type is the one given, if any; resolved is the type applied, for the record of the scale.
export function positionScale(value, keys, {type, domain, range}) {
  const V = keys.filter((key) => key in value).flatMap((key) => Array.from(value[key]));
  if (domain === undefined) domain = domainOf(type, V);
  // cm.fit maps discrete positions with a point scale, unless a d3 scale is given. Dates are
  // mapped linearly, but recorded as a UTC time scale for the ticks of axes.
  const resolved = typeof type === "function" ? type : discrete(type, V) ? "point" : isTemporal(V) ? "utc" : "linear";
  return {type, domain, range, resolved};
}

// The scale recorded for a position: the band of cm.spreadX if any, so that axes can label its
// categories, or the scale applied by cm.fit.
export function positionRecord({resolved, domain}, range, {band}) {
  if (band) return {type: "band", ...band, range};
  return resolve({type: resolved, domain, range});
}

// Rebuilds a d3 scale from a recorded scale, for the ticks of axes and for apply.
export function scaleOf({type, domain, range, paddingInner, paddingOuter, align, flex}) {
  if (typeof type === "function") return type;
  if (type === "band" && flex) return scaleFlex(domain, flex, {paddingInner, paddingOuter, align}, range);
  if (type === "band")
    return scaleBand(domain, range).paddingInner(paddingInner).paddingOuter(paddingOuter).align(align);
  if (type === "point") return scalePoint(domain, range);
  if (type === "utc") return scaleUtc(domain, range);
  return scaleLinear(domain, range);
}

// Gives a recorded position scale apply and invert, like the scales of Plot: apply maps a value to
// pixels, or to an angle or radius in polar, at the middle of its band if any; bandwidth is the
// width of the bands, or 0, and width the width of a category's band, which varies with flex. They aren't
// enumerable, so that records stay plain values.
export function callable(record) {
  const scale = scaleOf(record);
  const offset = scale.bandwidth ? scale.bandwidth() / 2 : 0;
  const middle = scale.middle ?? ((v) => scale(v) + offset);
  const width = scale.width ?? (() => offset * 2);
  const properties = {apply: {value: middle}, bandwidth: {value: offset * 2}, width: {value: width}};
  if (scale.invert) properties.invert = {value: (p) => scale.invert(p)};
  return Object.defineProperties(record, properties);
}

// The keys of a position scale: its own, such as x and x1, and the channels that share it by the
// axis, such as {value: "v2", scale: "y"}, or by the name of the context's scale.
export function keysOf(value, hints, keys, axis) {
  const name = scaleName(hints, keys, axis);
  const shared = Object.keys(value).filter(
    (key) => !keys.includes(key) && (hints[key]?.scale === axis || hints[key]?.scale === name),
  );
  return [...keys, ...shared];
}

// The name of the scale of a context's position along an axis: the scale given to its position,
// such as x: {value: "culmen_length_mm", scale: "length"}, else the axis itself, such as x.
export function scaleName(hints, keys, axis) {
  return axisHint(hints, keys).scale ?? axis;
}

// The contexts by the name of their scale along an axis, in order: contexts whose positions use
// the same scale, such as length in a scatterplot and the histogram above it, resolve it together.
export function byScaleName(data, keys, axis) {
  const groups = new Map();
  for (const context of data) {
    const name = scaleName(context.hints ?? {}, keys, axis);
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(context);
  }
  return groups;
}

// The keys of the channels of the contexts along an axis, such as x, x1 and the channels that
// share their scale.
export function allKeysOf(data, keys, axis) {
  return Array.from(new Set(data.flatMap(({value, hints = {}}) => keysOf(value, hints, keys, axis))));
}

// The label of a channel, such as its field name, for axes and legends.
export function labeled(scale, {label} = {}) {
  return label === undefined ? scale : {...scale, label};
}

// The hint of an axis merges the hints of its keys, such as x and x1; the first key wins.
export function axisHint(hints, keys) {
  return Object.assign(
    {},
    ...keys
      .slice()
      .reverse()
      .map((key) => hints[key]),
  );
}

export function hasAny(value, keys) {
  return keys.some((key) => key in value);
}

// Keeps the series of the rows in z before their colors are scaled, so that shapes drawn per
// series, such as cm.areaY, don't merge series that share a color.
export function withSeries(context) {
  const {value} = context;
  if ("z" in value) return context;
  const {Z} = seriesOf(context);
  return Z ? {...context, value: {...value, z: Z}} : context;
}

// Whether a flow is nested in a mark, such as flow.append(cm.g).data((d) => d.rows), rather
// than at the root of the chart.
export function isNested(flow) {
  return flow._parent !== flow._context.root;
}

// The channels of the contexts together, for the scales they share. The values are appended one
// by one, as push(...values) would overflow the stack for large data.
export function merge(data, keys) {
  const value = {};
  for (const {value: V} of data) {
    for (const key of keys) {
      if (!(key in V)) continue;
      const M = (value[key] ??= []);
      for (const v of V[key]) M.push(v);
    }
  }
  return value;
}

// The domain hinted by every context, for the type of the scale and its values: the union of
// categories for a discrete scale, even of two numbers; else the extent of every endpoint, such as
// the extents of cm.stackY with chunk, reversed if every domain runs high to low. Undefined if a
// context hints none.
export function sharedDomain(domains, type, values) {
  if (!domains.length || domains.some((d) => d === undefined)) return undefined;
  if (discrete(type, values)) return Array.from(new InternSet(domains.flat()));
  const extent = [min(domains, (d) => min(d)), max(domains, (d) => max(d))];
  return domains.every((d) => d[0] > d[d.length - 1]) ? extent.reverse() : extent;
}

// The point at the radius r and the angle a of a polar frame, clockwise from 12 o'clock.
export function polarPoint({cx, cy}, r, a) {
  return [cx + r * Math.sin(a), cy - r * Math.cos(a)];
}

// The parent row of each context of a nested flow: the groups of flow.data((d) => d.rows) are
// numbered across the rows of all the parent's groups, as when they're rendered. The branches of a
// joined flow are each numbered from the first row, as each is drawn on its own.
function parentRows(flow, n) {
  const counts = flow._branches?.map(({count}) => count) ?? [n];
  return counts.flatMap((count) => {
    const rows = [];
    for (const entry of flow._parent._data) {
      for (let k = 0; k < entry.group.length && rows.length < count; k++) rows.push([entry, k]);
    }
    return rows;
  });
}

// Whether a context has no rows, such as a facet without data.
function isEmptyContext({I, group = []}) {
  return (I ?? group).length === 0;
}

// The frames of the contexts of a nested flow, in the coordinates of their parent rows, which
// they're drawn at. Along each axis, a parent row with an extent, such as a band, gives the
// frame its extent, as a facet's cell; a row at a point gives a frame of the given size around
// it, as a glyph; and an axis the parent doesn't encode gives the parent's frame. A polar parent
// places its rows at their screen points, so they're glyphs. Every frame is marked nested, so that
// axes leave their titles to the outer chart, and empty if it has no rows, so that it draws no
// axes; the cells of a grid also record the edges they label.
export function nestedFrames(flow, data, {width = 40, height = 40} = {}) {
  const boxes = parentRows(flow, data.length).map(([{value = {}, context = {}}, k]) => {
    const {x: X = [], x1: X1, y: Y = [], y1: Y1} = value;
    const {frame: parent, scales = {}} = context;
    const tx = X[k] ?? 0;
    const ty = Y[k] ?? 0;
    if (parent?.type === "polar") {
      const a = X1 ? (X[k] + X1[k]) / 2 : X[k];
      const r = Y1 ? (Y[k] + Y1[k]) / 2 : Y[k];
      const [px, py] = polarPoint(parent, r, a);
      return {box: [px - width / 2, px + width / 2, py - height / 2, py + height / 2], tx, ty, cell: false};
    }
    const extent = (V, V1, key, size, [start, end]) => {
      if (V1) return [Math.min(V[k], V1[k]), Math.max(V[k], V1[k])];
      if (scales[key]) return [V[k] - size / 2, V[k] + size / 2];
      return parent ? [start, end] : [V[k] - size / 2, V[k] + size / 2];
    };
    const [left, right] = extent(X, X1, "x", width, [parent?.left, parent?.right]);
    const [top, bottom] = extent(Y, Y1, "y", height, [parent?.top, parent?.bottom]);
    // A cell of a grid has an extent, such as a band; a glyph at a point labels its own axes.
    return {box: [left, right, top, bottom], tx, ty, cell: !!(X1 || Y1)};
  });
  // Facets in a grid: the bottom (or top) cell of each column labels x, and the left (or right)
  // cell of each row labels y, by the anchor of the axis. Like Plot, cells without rows are
  // skipped, as they draw no axes, so an edge falls on the nearest cell with rows; and cells
  // missing from the grid, such as the days before the first of a month, don't count.
  const filled = boxes.filter((_, j) => !isEmptyContext(data[j]));
  const same = (a, b) => Math.abs(a - b) < 1e-6;
  const isBottom = ({box: [l, , , b]}) => filled.every(({box}) => !same(box[0], l) || box[3] <= b + 1e-6);
  const isTop = ({box: [l, , t]}) => filled.every(({box}) => !same(box[0], l) || box[2] >= t - 1e-6);
  const isLeft = ({box: [l, , t]}) => filled.every(({box}) => !same(box[2], t) || box[0] >= l - 1e-6);
  const isRight = ({box: [, r, t]}) => filled.every(({box}) => !same(box[2], t) || box[1] <= r + 1e-6);
  return boxes.map((frame, j) => {
    const {
      box: [l, r, t, b],
      tx,
      ty,
      cell,
    } = frame;
    return {
      left: l - tx,
      right: r - tx,
      top: t - ty,
      bottom: b - ty,
      nested: true,
      ...(isEmptyContext(data[j]) && {empty: true}),
      ...(cell && {
        edges: {top: isTop(frame), right: isRight(frame), bottom: isBottom(frame), left: isLeft(frame)},
      }),
    };
  });
}

// A band scale whose bands are proportional to weights, like G2's flex for shareSize: each
// category's step is its weight, and the padding is a fraction of the mean step, so that equal
// weights give the bands of d3.scaleBand. It maps a category to the start of its band; width and
// middle give the rest of the band. A band lighter than the padding is empty.
export function scaleFlex(domain, weights, {paddingInner = 0, paddingOuter = 0, align = 0.5} = {}, [r0, r1] = [0, 1]) {
  const total = weights.reduce((a, b) => a + b, 0);
  const mean = total / weights.length || 1;
  const unit = (r1 - r0) / (total - paddingInner * mean + 2 * paddingOuter * mean || 1);
  const index = new InternMap(domain.map((d, i) => [d, i]));
  const starts = [];
  // Like d3.scaleBand, align shares the outer padding between the two ends.
  let start = r0 + 2 * paddingOuter * mean * unit * align;
  for (const w of weights) (starts.push(start), (start += w * unit));
  // Signed, so that a reversed range keeps the bands' middles.
  const width = (v) => Math.max(0, weights[index.get(v)] - paddingInner * mean) * unit;
  const scale = (v) => starts[index.get(v)];
  scale.width = width;
  scale.middle = (v) => scale(v) + width(v) / 2;
  scale.domain = () => domain;
  scale.range = () => [r0, r1];
  return scale;
}
