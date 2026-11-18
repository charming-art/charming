import {InternMap, InternSet, max, min, quantile, sort} from "d3-array";
import {
  scaleBand,
  scaleLinear,
  scaleLog,
  scalePoint,
  scalePow,
  scaleSequential,
  scaleSqrt,
  scaleSymlog,
  scaleUtc,
} from "d3-scale";
import * as chromatic from "d3-scale-chromatic";
import {discrete, domainOf} from "../../core/transform/scale.js";
import {isColor} from "../color.js";
import {seriesOf} from "./series.js";
import {schemeCategory} from "../scheme.js";

// The scales shared by cm.plane and cm.polar. Besides positions, they scale colors, radii and
// opacities, such as r: "body_mass_g" or fillOpacity: "count".
const colorKeys = ["fill", "stroke"];
const opacityKeys = ["fillOpacity", "strokeOpacity"];
export const scaledKeys = [...colorKeys, "r", ...opacityKeys];

// The d3 scales of the continuous types that are named, like Plot's, such as {type: "log"}, with
// their options: the exponent of pow, the base of log and the constant of symlog. Other types, such
// as "linear", "ordinal" or a d3 scale, are as given.
const continuous = {
  log: ({base}) => (base === undefined ? scaleLog() : scaleLog().base(base)),
  sqrt: () => scaleSqrt(),
  pow: ({exponent}) => (exponent === undefined ? scalePow() : scalePow().exponent(exponent)),
  symlog: ({constant}) => (constant === undefined ? scaleSymlog() : scaleSymlog().constant(constant)),
};

export function typeOf(type, options = {}) {
  return typeof type === "string" && Object.hasOwn(continuous, type) ? continuous[type](options) : type;
}

// Whether a scale is logarithmic, which only maps values of one sign.
function isLog(type) {
  return typeof type?.base === "function";
}

// Like Plot's, the domain of a log scale is the extent of the positive values, or of the negative
// values if none is positive, as zero and values of the other sign have no logarithm.
function logDomain(V) {
  const positive = [min(V, (v) => (v > 0 ? v : NaN)), max(V, (v) => (v > 0 ? v : NaN))];
  if (positive[0] !== undefined) return positive;
  return [min(V, (v) => (v < 0 ? v : NaN)) ?? -1, max(V, (v) => (v < 0 ? v : NaN)) ?? -1];
}

export function isNumeric(values) {
  return typeof values?.find((d) => d != null) === "number";
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

// Like Plot's, the range of a radius scale maps the first quartile of the positive values to 3px,
// so that most dots are visible, and its maximum to at most 30px.
function radiusRange(V, domain) {
  const q = quantile(V, 0.25, (v) => (v > 0 ? v : NaN)) ?? 1;
  const range = domain.map((d) => 3 * Math.sqrt(d / q));
  const k = 30 / max(range);
  return k < 1 ? range.map((r) => r * k) : range;
}

// The scales of the hinted channels besides positions. Colors are categorical by default, and
// sequential for numbers or a linear type, like Plot, through the scheme's interpolator ("turbo"
// by default) or the range's colors; missing numbers have no color. Radii and opacities are
// numbers from 0: a radius by a square root, so that the area of a dot tracks its value, and an
// opacity linearly to [0, 1]. Values that aren't numbers aren't scaled, and like Plot's, the type
// "identity" leaves values as they are, such as radii already in pixels.
export function channelScales(value, hints) {
  const scales = {};
  for (const key of ["r", ...opacityKeys]) {
    if (!(key in hints) || !(key in value)) continue;
    const {type, domain, range, ...options} = hints[key];
    if (type === "identity") continue;
    const V = value[key];
    if (type === undefined && !isNumeric(V)) continue;
    const radius = key === "r";
    const t = typeOf(type ?? (radius ? "sqrt" : "linear"), options);
    // From 0, unless the scale is logarithmic, which has no logarithm of 0.
    const d = domain ?? (isLog(t) ? logDomain(V) : [0, max(V) ?? 1]);
    const r = range ?? (radius ? radiusRange(V, d) : [0, 1]);
    scales[key] = {type: t, domain: d, range: r};
  }
  for (const key of colorKeys) {
    if (!(key in hints) || !(key in value)) continue;
    const {type, domain, range, scheme = "turbo"} = hints[key];
    if (type === "identity") continue;
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

// The scales as descriptors of core cm.scale, which names the type of a scale "scale".
export function scaleDescriptors(scales) {
  return Object.fromEntries(Object.entries(scales).map(([key, {type, ...scale}]) => [key, {scale: type, ...scale}]));
}

function isTemporal(values) {
  return values.find((d) => d != null) instanceof Date;
}

// The scale shared by position channels such as x and x1, with the domain inferred from all of them.
// The type is the one given, if any; resolved is the type applied, for the record of the scale.
export function positionScale(value, keys, {type, domain, range}) {
  type = typeOf(type);
  const V = keys.filter((key) => key in value).flatMap((key) => Array.from(value[key]));
  if (domain === undefined) domain = isLog(type) ? logDomain(V) : domainOf(type, V);
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

// The keys of a position scale in a context: its own, such as x and x1, and the other channels that
// share it by the axis, such as {value: "v2", scale: "y"}, or by the name of the context's scale.
export function keysOf(value, hints, keys, axis) {
  const name = scaleName(hints, keys, axis);
  // Positions choose their own scale, so only the other channels join one, even if names collide.
  const shared = Object.keys(value).filter(
    (key) => !positions.has(key) && !keys.includes(key) && (hints[key]?.scale === axis || hints[key]?.scale === name),
  );
  return [...keys, ...shared];
}

const positions = new Set(["x", "x1", "y", "y1"]);

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

// The scale options of cm.plane and cm.polar, by the name of the scale, such as {y: {domain: [0,
// 100]}, length: {type: "log"}, fill: {scheme: "PiYG"}}, laid over the hints of a context, so that
// they take precedence over what transforms recorded and over inference. A position's reverse and
// label go to the first of its keys, which wins among them, and a color's options to its channel.
// The type and domain of a position are read with positionOptions instead, as whether they apply
// depends on the other contexts of the scale: a band's domain comes from its spread.
export function withScaleOptions(context, scales, axes) {
  const hints = {...context.hints};
  for (const [keys, axis] of axes) {
    const options = scales[scaleName(hints, keys, axis)];
    if (!options) continue;
    const {reverse, label} = options;
    hints[keys[0]] = {...hints[keys[0]], ...definedOptions({reverse, label})};
  }
  for (const key of scaledKeys) {
    if (scales[key] && key in hints) hints[key] = {...hints[key], ...definedOptions(scales[key])};
  }
  return {...context, hints};
}

// The type and domain of a position from the options of its scale, unless the scale has bands,
// such as those of cm.spreadX, whose domain comes from their spread, given the hints of the contexts
// that share the scale.
export function positionOptions(hints, options = {}) {
  if (hints.some((hint) => hint.band !== undefined)) return {};
  return definedOptions({type: typeOf(options.type, options), domain: options.domain});
}

// The hints of the scaled channels of the contexts, for channelScales: for each channel, such as a
// color, the hint of the first context with one, with the first domain of any, so that the options
// of the scale, which every context with the channel has, come first, then an order recorded by a
// transform in any context, such as cm.stackY's, then inference.
export function channelHints(data) {
  const hints = {};
  for (const key of scaledKeys) {
    const hinted = data.map((context) => context.hints?.[key]).filter((hint) => hint !== undefined);
    if (!hinted.length) continue;
    const domain = hinted.find((hint) => hint.domain !== undefined)?.domain;
    hints[key] = domain === undefined ? hinted[0] : {...hinted[0], domain};
  }
  return hints;
}

function definedOptions(options) {
  return Object.fromEntries(Object.entries(options).filter(([, v]) => v !== undefined));
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
  // Keyframes are moments in time, not places, so a chart in a keyframe at the root is at the root.
  let node = flow._parent;
  while (node !== flow._context.root && node._data?.[0]?.render.keyframe) node = node._parent;
  return node !== flow._context.root;
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

// The scale of a position shared by the contexts, for cm.plane and cm.polar: its type and domain as
// given, such as the options of the scale, else from the hints of the contexts, else inferred from
// the values of all of them.
export function sharedScale(data, all, keys, {type, domain} = {}) {
  const hints = data.map(({hints = {}}) => axisHint(hints, keys));
  type ??= hints[0]?.type;
  const values = merge(data, all);
  domain ??= sharedDomain(
    hints.map((hint) => hint.domain),
    type,
    all.flatMap((key) => values[key] ?? []),
  );
  return positionScale(values, all, {type, domain});
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
    const within = parent ? [parent.left, parent.right, parent.top, parent.bottom] : null;
    return {box: [left, right, top, bottom], tx, ty, cell: !!(X1 || Y1), within};
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
  // The room around each cell of a grid, for the axes asked of it: on each side, the gap to the
  // nearest cell along it, else to the edge of the parent's frame.
  const roomOf = ({box: [l, r, t, b], within}) => {
    const across = (a0, a1, b0, b1) => a0 < b1 - 1e-6 && b0 < a1 - 1e-6;
    const gaps = {left: [], right: [], top: [], bottom: []};
    for (const {box} of boxes) {
      if (across(t, b, box[2], box[3])) {
        if (box[1] <= l + 1e-6) gaps.left.push(l - box[1]);
        if (box[0] >= r - 1e-6) gaps.right.push(box[0] - r);
      }
      if (across(l, r, box[0], box[1])) {
        if (box[3] <= t + 1e-6) gaps.top.push(t - box[3]);
        if (box[2] >= b - 1e-6) gaps.bottom.push(box[2] - b);
      }
    }
    const [wl, wr, wt, wb] = within ?? [l, r, t, b];
    const edge = {left: l - wl, right: wr - r, top: t - wt, bottom: wb - b};
    return Object.fromEntries(
      Object.keys(gaps).map((side) => [side, Math.max(0, gaps[side].length ? Math.min(...gaps[side]) : edge[side])]),
    );
  };
  return boxes.map((frame, j) => {
    const {
      box: [l, r, t, b],
      tx,
      ty,
      cell,
    } = frame;
    const nested = {
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
    // The room around a cell is kept apart from its frame, for the margins of the chart nested in it.
    if (cell) Object.defineProperty(nested, "room", {value: roomOf(frame)});
    return nested;
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

// The options of an axis given with the options of its scale, such as {x: {axis: "top", grid:
// true}}: the label stays the scale's, so that its arrow is the scale's.
const axisKeys = ["ticks", "tickFormat", "tickSize", "tickPadding", "tickRotate", "grid", "labelAnchor"];

// The options of a legend given with the options of its scale, such as {fill: {legend: true}}.
const legendKeys = ["ticks", "tickFormat", "width", "height"];

function pick(options = {}, keys) {
  return definedOptions(Object.fromEntries(keys.map((key) => [key, options[key]])));
}

// The legends asked by the options of scales, such as {fill: {legend: true}}, with their options
// and sides: at the top, by default, or on the right with legend: "right".
export function legendsOf(options) {
  const legends = {};
  for (const key of scaledKeys) {
    const legend = options[key]?.legend;
    if (legend) legends[key] = {...pick(options[key], legendKeys), anchor: legend === "right" ? "right" : "top"};
  }
  return legends;
}

// The guides of a context, for its axes and legends: the sides of each axis, from the axis option
// of its scale, such as "top", "both", true for its first side, or null for none, else the default
// sides, and the options of each axis and legend. The sides of x and y are given as their first
// side and both of them, such as {first: "bottom", both: ["bottom", "top"]}, with their defaults,
// such as ["bottom"] or none in a nested chart.
export function guidesOf(id, options, nameX, nameY, sides, defaults) {
  const anchors = (option, {first, both}, side) => {
    if (option === undefined) return side;
    if (option === null || option === false) return [];
    if (option === true) return [first];
    return option === "both" ? both : [option];
  };
  const {axis: axisX} = options[nameX] ?? {};
  const {axis: axisY} = options[nameY] ?? {};
  const legends = legendsOf(options);
  return {
    id,
    x: {name: nameX, anchors: anchors(axisX, sides.x, defaults.x), ...pick(options[nameX], axisKeys)},
    y: {name: nameY, anchors: anchors(axisY, sides.y, defaults.y), ...pick(options[nameY], axisKeys)},
    legends,
  };
}

// The implicit marks of the guides of contexts, for cm.plane and cm.polar: an axis of x and of y
// per side that any context draws, in two layers, and a legend if any context has one.
export function guideMarks(values, {axisX, axisY, legend}) {
  const marks = [];
  const sides = (axis) => Math.max(0, ...values.map(({guides}) => guides?.[axis].anchors.length ?? 0));
  // Each axis is drawn in two layers: its grid under the shapes added to the chart, and its tick
  // marks, labels and title in front of them, such as the labels of the radius of cm.polar.
  for (const [axis, shape] of [
    ["x", axisX],
    ["y", axisY],
  ]) {
    for (let side = 0; side < sides(axis); side++) {
      marks.push([shape, {side, layer: "grid"}]);
      marks.push([shape, {side, layer: "axis"}, {front: true}]);
    }
  }
  if (values.some(({guides}) => guides && Object.keys(guides.legends).length)) marks.push([legend, {}]);
  return marks;
}
