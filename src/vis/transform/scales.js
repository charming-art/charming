import {InternMap, InternSet, max, min, quantile, sort} from "d3-array";
import {
  scaleBand,
  scaleLinear,
  scaleLog,
  scalePoint,
  scalePow,
  scaleSequential,
  scaleSequentialLog,
  scaleSequentialPow,
  scaleSequentialSqrt,
  scaleSequentialSymlog,
  scaleSqrt,
  scaleSymlog,
  scaleUtc,
} from "d3-scale";
import * as chromatic from "d3-scale-chromatic";
import {discrete, domainOf} from "../../core/transform/scale.js";
import {isColor} from "../color.js";
import {seriesOf} from "./series.js";
import {schemeCategory} from "../scheme.js";

// The scales shared by cm.plane and cm.polar. Besides positions, they scale colors, radii,
// opacities and the timing of transitions, such as r: "body_mass_g", fillOpacity: "count" or
// enterDelay: "start".
const colorKeys = ["fill", "stroke"];
const opacityKeys = ["fillOpacity", "strokeOpacity"];
export const timingKeys = ["appearDelay", "appearDuration", "enterDelay", "enterDuration", "exitDelay", "exitDuration"];
export const scaledKeys = [...colorKeys, "r", ...opacityKeys, ...timingKeys];

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

// The transform of the values of a scale, from its options: transform, such as (d) => d / 1000, or
// percent, which maps proportions to percentages, like Plot's.
export function transformOf({transform, percent} = {}) {
  return transform ?? (percent ? (d) => d * 100 : undefined);
}

// The domain of a continuous scale extended, like Plot's: with zero, to include 0, unless the scale
// is logarithmic, and with nice, to round values, such as [0, 100] rather than [3, 97], nice being
// true or a count of ticks, which d3's log scales ignore, rounding to powers of their base.
function adjustDomain(domain, {zero, nice} = {}, type) {
  if (!domain || domain.length !== 2 || !domain.every((d) => typeof d === "number" || d instanceof Date)) return domain;
  const t = typeof type === "string" ? typeOf(type) : type;
  let [d0, d1] = domain;
  // A log scale has no logarithm of 0, so it isn't extended to it.
  if (zero && typeof d0 === "number" && !isLog(t)) {
    [d0, d1] = d0 <= d1 ? [Math.min(0, d0), Math.max(0, d1)] : [Math.max(0, d0), Math.min(0, d1)];
  }
  if (nice) {
    const base = typeof t === "function" ? t.copy() : d0 instanceof Date ? scaleUtc() : scaleLinear();
    [d0, d1] = base
      .domain([d0, d1])
      .nice(nice === true ? undefined : nice)
      .domain();
  }
  return [d0, d1];
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
// "identity" leaves values as they are, such as radii already in pixels. Timings, such as
// enterDelay, are milliseconds, unless their scale has a range: then they're scaled linearly from
// 0, so that a duration twice as long lasts twice as long, such as {domain: [0, 1], range: [0, 600]}
// for 600ms per unit, or over the extent of the values to the range, without a domain.
export function channelScales(value, hints) {
  const scales = {};
  for (const key of timingKeys) {
    if (!(key in hints) || !(key in value)) continue;
    const {type, domain, range, clamp, ...options} = hints[key];
    if (range === undefined || type === "identity" || !isNumeric(value[key])) continue;
    const t = typeOf(type ?? "linear", options);
    const d = adjustDomain(domain ?? [0, max(value[key]) ?? 1], options, t);
    scales[key] = {type: t, domain: d, range, ...(clamp && {clamp})};
  }
  for (const key of ["r", ...opacityKeys]) {
    if (!(key in hints) || !(key in value)) continue;
    const {type, domain, range, clamp, ...options} = hints[key];
    if (type === "identity") continue;
    const V = value[key];
    if (type === undefined && !isNumeric(V)) continue;
    const radius = key === "r";
    const t = typeOf(type ?? (radius ? "sqrt" : "linear"), options);
    // From 0, unless the scale is logarithmic, which has no logarithm of 0.
    const d = adjustDomain(domain ?? (isLog(t) ? logDomain(V) : [0, max(V) ?? 1]), options, t);
    const r = range ?? (radius ? radiusRange(V, d) : [0, 1]);
    scales[key] = {type: t, domain: d, range: r, ...(clamp && {clamp})};
  }
  for (const key of colorKeys) {
    if (!(key in hints) || !(key in value)) continue;
    const {type, domain, range, scheme = "turbo", clamp, ...options} = hints[key];
    if (type === "identity") continue;
    const V = value[key];
    if (type === undefined && domain === undefined && range === undefined && isIdentity(V)) continue;
    // Like Plot's, a continuous color of a named type, such as log, is sequential too, through the
    // interpolator of the scheme, or the colors of the range.
    const sequentialOf = {
      linear: () => scaleSequential(),
      log: () => (options.base === undefined ? scaleSequentialLog() : scaleSequentialLog().base(options.base)),
      sqrt: () => scaleSequentialSqrt(),
      pow: () =>
        options.exponent === undefined ? scaleSequentialPow() : scaleSequentialPow().exponent(options.exponent),
      symlog: () =>
        options.constant === undefined ? scaleSequentialSymlog() : scaleSequentialSymlog().constant(options.constant),
    };
    const named = type === undefined && isNumeric(V) ? "linear" : Object.hasOwn(sequentialOf, type) ? type : undefined;
    if (named) {
      const log = named === "log";
      const sequential =
        range === undefined
          ? sequentialOf[named]().interpolator(interpolatorOf(scheme))
          : named === "linear"
            ? scaleLinear()
            : typeOf(named, options);
      const d = adjustDomain(domain ?? (log ? logDomain(V) : [min(V), max(V)]), options, sequential);
      scales[key] = {type: sequential, domain: d, range, ...(clamp && {clamp})};
      continue;
    }
    const ordinal = type === undefined || type === "ordinal";
    const continuous = !ordinal && !discrete(type, V);
    scales[key] = {
      type: type ?? "ordinal",
      domain: domain ?? (ordinal ? sort(new InternSet(V)) : domainOf(type, V)),
      range: range ?? (ordinal ? schemeCategory : undefined),
      ...(continuous && clamp && {clamp}),
    };
    // A continuous color of another type, such as log, takes zero and nice too.
    if (continuous) scales[key].domain = adjustDomain(scales[key].domain, options, type);
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
export function positionScale(value, keys, {type, domain, range, nice, zero, clamp}) {
  type = typeOf(type);
  const V = keys.filter((key) => key in value).flatMap((key) => Array.from(value[key]));
  if (domain === undefined) domain = isLog(type) ? logDomain(V) : domainOf(type, V);
  // A continuous domain may be extended to zero, or to round values.
  if (!discrete(type, V))
    domain = adjustDomain(domain, {nice, zero: zero && !isLog(type)}, typeof type === "function" ? type : undefined);
  // cm.fit maps discrete positions with a point scale, unless a d3 scale is given. Dates are
  // mapped linearly, but recorded as a UTC time scale for the ticks of axes.
  const resolved = typeof type === "function" ? type : discrete(type, V) ? "point" : isTemporal(V) ? "utc" : "linear";
  return {type, domain, range, resolved, ...(clamp && !discrete(type, V) && {clamp})};
}

// The scale recorded for a position: the band of cm.spreadX if any, so that axes can label its
// categories, or the scale applied by cm.fit.
export function positionRecord({resolved, domain, clamp}, range, {band}) {
  if (band) return {type: "band", ...band, range};
  return {...resolve({type: resolved, domain, range}), ...(clamp && {clamp})};
}

// Rebuilds a d3 scale from a recorded scale, for the ticks of axes and for apply.
export function scaleOf({type, domain, range, paddingInner, paddingOuter, align, flex, clamp}) {
  if (clamp) return scaleOf({type, domain, range}).copy().clamp(true);
  if (typeof type === "function") return type;
  if (type === "band" && flex) return scaleFlex(domain, flex, {paddingInner, paddingOuter, align}, range);
  if (type === "band")
    return scaleBand(domain, range).paddingInner(paddingInner).paddingOuter(paddingOuter).align(align);
  if (type === "point") return scalePoint(domain, range);
  if (type === "utc") return scaleUtc(domain, range);
  return scaleLinear(domain, range);
}

// Whether a value has arithmetic, so that the transform of its scale applies: a number or a date.
const quantity = (v) => typeof v === "number" || v instanceof Date;

// Gives a recorded position scale apply and invert, like the scales of Plot: apply maps a value to
// pixels, or to an angle or radius in polar, at the middle of its band if any; bandwidth is the
// width of the bands, or 0, and width the width of a category's band, which varies with flex. They aren't
// enumerable, so that records stay plain values. Like Plot's, apply transforms a value first, with
// the transform or percent of the scale's options, as the values of its channels were; and the
// positions follow a grid of cells nested in the chart, if it was scaled to keep room at its edges.
export function callable(record, options) {
  const scale = scaleOf(record);
  const offset = scale.bandwidth ? scale.bandwidth() / 2 : 0;
  const middle = scale.middle ?? ((v) => scale(v) + offset);
  const width = scale.width ?? (() => offset * 2);
  const f = record.type === "band" ? undefined : transformOf(options);
  const at = f ? (v) => middle(quantity(v) ? f(v) : v) : middle;
  // The positions follow a grid of cells nested in the chart, if it was scaled; see gridFrames.
  const k = () => record.warp?.k ?? 1;
  const properties = {
    apply: {value: (v) => (record.warp ? record.warp(at(v)) : at(v))},
    bandwidth: {get: () => offset * 2 * k()},
    width: {value: (v) => width(v) * k()},
  };
  // Invert undoes the grid's map first, so that invert(apply(v)) is v.
  const unwarp = (p) => (record.warp?.k ? (p - record.warp.b) / record.warp.k : p);
  if (scale.invert) properties.invert = {value: (p) => scale.invert(unwarp(p))};
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
  const value = {...context.value};
  // The values of a scale with transform or percent are transformed, with the domains hinted for
  // them, such as the extents of a stack, as they reach the plane.
  // Only numbers and dates are transformed, as categories have no arithmetic: "a" * 100 is NaN.
  const transform = (key, f) => {
    if (!(key in value)) return false;
    const first = Array.from(value[key]).find((v) => v != null);
    if (!quantity(first)) return false;
    value[key] = Array.from(value[key], (v) => (v == null ? v : f(v)));
    const domain = hints[key]?.domain;
    if (Array.isArray(domain) && domain.every(quantity)) hints[key] = {...hints[key], domain: domain.map(f)};
    return true;
  };
  for (const [keys, axis] of axes) {
    const options = scales[scaleName(hints, keys, axis)];
    if (!options) continue;
    const {reverse, label, percent, transform: own} = options;
    const f = transformOf(options);
    let transformed = false;
    if (f && !hints[keys[0]]?.band) {
      for (const key of keysOf(value, hints, keys, axis)) transformed = transform(key, f) || transformed;
    }
    // Like Plot's, a label inferred from a field says it's a percentage, if percent scaled its values,
    // rather than a transform given with it.
    const inferred = hints[keys[0]]?.label;
    const percented = percent && !own && transformed && label === undefined && inferred != null;
    hints[keys[0]] = {
      ...hints[keys[0]],
      ...definedOptions({reverse, label: label !== undefined ? label : percented ? `${inferred} (%)` : undefined}),
    };
  }
  for (const key of scaledKeys) {
    if (!scales[key]) continue;
    const f = transformOf(scales[key]);
    if (f) transform(key, f);
    if (key in hints) hints[key] = {...hints[key], ...definedOptions(scales[key])};
  }
  return {...context, value, hints};
}

// The type and domain of a position from the options of its scale, unless the scale has bands,
// such as those of cm.spreadX, whose domain comes from their spread, given the hints of the contexts
// that share the scale.
export function positionOptions(hints, options = {}) {
  if (hints.some((hint) => hint.band !== undefined)) return {};
  const {domain, nice, zero, clamp} = options;
  return definedOptions({type: typeOf(options.type, options), domain, nice, zero, clamp});
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
export function sharedScale(data, all, keys, {type, domain, ...options} = {}) {
  const hints = data.map(({hints = {}}) => axisHint(hints, keys));
  type ??= hints[0]?.type;
  const values = merge(data, all);
  domain ??= sharedDomain(
    hints.map((hint) => hint.domain),
    type,
    all.flatMap((key) => values[key] ?? []),
  );
  return positionScale(values, all, {type, domain, ...options});
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
    flow._parent._data.forEach((entry, i) => {
      for (let k = 0; k < entry.group.length && rows.length < count; k++) rows.push([entry, k, i]);
    });
    return rows;
  });
}

// The origin of the j-th group of a node in the coordinates of the root: the shapes of a node,
// such as cm.g, are drawn at the point of each row of their parent, so the origin of a group is
// the sum of the points of the rows it's drawn under, up to the root.
function originOf(node, j) {
  const parent = node?._parent;
  if (!parent?._data) return [0, 0];
  let n = 0;
  for (let i = 0; i < parent._data.length; i++) {
    const {group, value = {}} = parent._data[i];
    if (j < n + group.length) {
      const k = j - n;
      const [ox, oy] = originOf(parent, i);
      return [ox + (value.x?.[k] ?? 0), oy + (value.y?.[k] ?? 0)];
    }
    n += group.length;
  }
  return [0, 0];
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
  const boxes = parentRows(flow, data.length).map(([{value = {}, context = {}}, k, i]) => {
    // The origin of the coordinates of the parent row, in the root's.
    const origin = originOf(flow._parent, i);
    const {x: X = [], x1: X1, y: Y = [], y1: Y1} = value;
    const {frame: parent, scales = {}, guides} = context;
    const tx = X[k] ?? 0;
    const ty = Y[k] ?? 0;
    if (parent?.type === "polar") {
      const a = X1 ? (X[k] + X1[k]) / 2 : X[k];
      const r = Y1 ? (Y[k] + Y1[k]) / 2 : Y[k];
      const [px, py] = polarPoint(parent, r, a);
      return {box: [px - width / 2, px + width / 2, py - height / 2, py + height / 2], tx, ty, cell: false, origin};
    }
    const extent = (V, V1, key, size, [start, end]) => {
      if (V1) return [Math.min(V[k], V1[k]), Math.max(V[k], V1[k])];
      if (scales[key]) return [V[k] - size / 2, V[k] + size / 2];
      return parent ? [start, end] : [V[k] - size / 2, V[k] + size / 2];
    };
    const [left, right] = extent(X, X1, "x", width, [parent?.left, parent?.right]);
    const [top, bottom] = extent(Y, Y1, "y", height, [parent?.top, parent?.bottom]);
    // A cell of a grid has an extent, such as a band; a glyph at a point labels its own axes.
    return {box: [left, right, top, bottom], tx, ty, cell: !!(X1 || Y1), parent, origin, scales, guides};
  });
  // Facets in a grid: the bottom (or top) cell of each column labels x, and the left (or right)
  // cell of each row labels y, by the anchor of the axis, compared in the coordinates of the root,
  // as cells may be drawn under different parents, such as the rows of a marginal histogram. Like
  // Plot, cells without rows are skipped, as they draw no axes, so an edge falls on the nearest
  // cell with rows; and cells missing from the grid, such as the days before the first of a month,
  // don't count.
  const absolute = ({box: [l, r, t, b], origin: [ox, oy]}) => [l + ox, r + ox, t + oy, b + oy];
  const filled = boxes.filter((_, j) => !isEmptyContext(data[j])).map(absolute);
  const same = (a, b) => Math.abs(a - b) < 1e-6;
  const isBottom = (frame) => {
    const [l, , , b] = absolute(frame);
    return filled.every((box) => !same(box[0], l) || box[3] <= b + 1e-6);
  };
  const isTop = (frame) => {
    const [l, , t] = absolute(frame);
    return filled.every((box) => !same(box[0], l) || box[2] >= t - 1e-6);
  };
  const isLeft = (frame) => {
    const [l, , t] = absolute(frame);
    return filled.every((box) => !same(box[2], t) || box[0] >= l - 1e-6);
  };
  const isRight = (frame) => {
    const [, r, t] = absolute(frame);
    return filled.every((box) => !same(box[2], t) || box[1] <= r + 1e-6);
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
    // The box of a cell and the frame of its parent, in the coordinates of the root, and the origin
    // of the cell, are kept apart from its frame, for the room of the axes of the chart nested in it.
    if (cell) {
      const [ox, oy] = frame.origin;
      const {parent} = frame;
      const within = parent ? [parent.left + ox, parent.right + ox, parent.top + oy, parent.bottom + oy] : null;
      const {scales, origin, guides} = frame;
      Object.defineProperty(nested, "cell", {
        value: {box: absolute(frame), x: ox + tx, y: oy + ty, within, scales, origin, guides, parent},
      });
    }
    return nested;
  });
}

// The frames of a chart nested in a grid of cells, such as facets, laid out with room kept at the
// edges of the grid for what's drawn past it: what the axes of the cells along an edge need past
// them, given by need for the frames of the cells, and the legends of the chart, measured by
// legends for the left of the grid and its height, as {top, right}: the height of the rows at the
// top, with their gaps, and the width of the columns on the right. The cells form one grid, in the
// coordinates of the root, even if drawn under different parents, such as the rows of a marginal
// histogram, so that its rows and columns stay aligned. On each side, the room is what's drawn plus
// 3px, past the room the grid already has to the edge of the parents' frames, such as the outer
// padding of their bands; the cells and the gaps between them are scaled into what's left, keeping
// their proportions, such as the widths of flex bands, and the padding between them. As the ticks
// and the legends depend on the size of the cells, they're measured again until they hold, up to
// three times, the room only growing, as fewer ticks in narrower cells may need less, such as "0"
// rather than "0.0". Like the legends of a chart, those of the grid are at the top of its parents'
// frames, 3px under it, from the left of the grid, above the axes at the top, else on the right of
// the grid, past its axes there, from the top of the topmost cells: where, in the coordinates of
// the root, is returned with the frames, for the legends to draw once for the whole grid. The
// positions of the parents follow the grid, so that their axes stay on the cells, and their axes
// at the top and on the right, measured by outer, move in to the grid, past the axes of the cells,
// when legends are on that side, so that the legends go past them, as at the root. A chart whose
// data is shared by its cells, given as an array rather than a function, is drawn in one frame for
// all of them, so it has no legends, and its parents keep their positions.
export function gridFrames(boxes, {need, legends, outer, shared}) {
  const cells = boxes.filter((frame) => frame.cell);
  if (!cells.length) return {frames: boxes};
  const B = cells.map(({cell}) => cell.box);
  const W = cells.map(({cell}) => cell.within).filter((w) => w);
  const [gl, gr, gt, gb] = [
    Math.min(...B.map((b) => b[0])),
    Math.max(...B.map((b) => b[1])),
    Math.min(...B.map((b) => b[2])),
    Math.max(...B.map((b) => b[3])),
  ];
  // The room the grid already has to the edges of its parents, such as their outer padding.
  const free = W.length
    ? {
        left: gl - Math.min(...W.map((w) => w[0])),
        right: Math.max(...W.map((w) => w[1])) - gr,
        top: gt - Math.min(...W.map((w) => w[2])),
        bottom: Math.max(...W.map((w) => w[3])) - gb,
      }
    : {left: 0, right: 0, top: 0, bottom: 0};
  // What the axes of the parents draw past their frames at the top and on the right, which the
  // legends on those sides go past: the parents' axes move in to the grid, and the legends take
  // the room they leave, plus 3px.
  const reach = {top: 0, right: 0};
  if (!shared && outer) {
    for (const {cell} of cells) {
      const {top, right} = outer(cell.scales ?? {}, cell.guides, cell.parent);
      [reach.top, reach.right] = [Math.max(reach.top, top), Math.max(reach.right, right)];
    }
  }
  const sides = ["left", "right", "top", "bottom"];
  let reserve = {left: 0, right: 0, top: 0, bottom: 0};
  // The grid inside the room kept at its edges.
  const inner = () => [gl + reserve.left, gr - reserve.right, gt + reserve.top, gb - reserve.bottom];
  const layout = () => {
    if (sides.every((side) => !reserve[side])) return boxes;
    const [nl, nr, nt, nb] = inner();
    const sx = gr > gl ? (nr - nl) / (gr - gl) : 1;
    const sy = gb > gt ? (nb - nt) / (gb - gt) : 1;
    return boxes.map((frame) => {
      if (!frame.cell) return frame;
      const {
        box: [l, r, t, b],
        x,
        y,
      } = frame.cell;
      return {
        ...frame,
        left: nl + (l - gl) * sx - x,
        right: nl + (r - gl) * sx - x,
        top: nt + (t - gt) * sy - y,
        bottom: nt + (b - gt) * sy - y,
      };
    });
  };
  const measure = (frames) => {
    const [nl, , nt, nb] = inner();
    const legend = shared ? {top: 0, right: 0} : legends(nl, nb - nt);
    return {need: need?.(frames) ?? {left: 0, right: 0, top: 0, bottom: 0}, legend};
  };
  let frames = layout();
  let measured = measure(frames);
  for (let pass = 0; pass < 3; pass++) {
    const {need: n, legend} = measured;
    // From the outside in: the legends, the axes of the parents, those of the cells, the cells.
    const room = {
      left: n.left ? n.left + 3 : 0,
      bottom: n.bottom ? n.bottom + 3 : 0,
      // The legends at the top include their gaps, 3px over them and 10 under them.
      top: legend.top ? legend.top + reach.top + n.top : n.top ? n.top + 3 : 0,
      right: n.right || legend.right ? n.right + (legend.right ? reach.right + 12 + legend.right : 0) + 3 : 0,
    };
    const left = moved(legend, reach);
    const next = Object.fromEntries(
      sides.map((side) => [
        side,
        Math.max(reserve[side], room[side] ? Math.max(0, room[side] - free[side] - left[side]) : 0),
      ]),
    );
    if (sides.every((side) => Math.abs(next[side] - reserve[side]) < 1e-9)) break;
    reserve = next;
    frames = layout();
    measured = measure(frames);
  }
  // The parents' positions follow the grid, so that their axes and annotations stay on the cells:
  // their records map through it, from the coordinates of each parent.
  if (shared) return {frames};
  if (frames !== boxes) {
    const [nl, nr, nt, nb] = inner();
    const sx = gr > gl ? (nr - nl) / (gr - gl) : 1;
    const sy = gb > gt ? (nb - nt) / (gb - gt) : 1;
    for (const {cell} of cells) {
      const {x: rx, y: ry} = cell.scales ?? {};
      const [ox, oy] = cell.origin;
      if (rx) warp(rx, sx, nl + (ox - gl) * sx - ox);
      if (ry) warp(ry, sy, nt + (oy - gt) * sy - oy);
    }
  }
  // The axes of the parents at the top and on the right move in to the grid, past the axes of the
  // cells, for the legends on those sides to go past them.
  const [nl, nr, nt, nb] = inner();
  const {need: n, legend} = measured;
  const left = moved(legend, reach);
  for (const {cell} of cells) {
    const {x: rx, y: ry} = cell.scales ?? {};
    const [ox, oy] = cell.origin;
    if (rx && left.top) edge(rx, "top", nt - n.top - oy);
    if (ry && left.right) edge(ry, "right", nr + n.right - ox);
  }
  // The legends are drawn by the first cell with rows, less the origin of its coordinates.
  const index = boxes.findIndex((frame) => frame.cell && !frame.empty);
  if (index < 0) return {frames};
  const {x: ox, y: oy} = boxes[index].cell;
  const top = gt - free.top - left.top + 3;
  const x = nr + n.right + (left.right ? reach.right : 0) + 12;
  return {frames, legendAt: {index, origin: [ox, oy], left: nl, top, x, y0: nt, y1: nb}};
}

// The room the axes of the parents leave past their frames, at the top and on the right, as they
// move in to a grid with legends on that side: what they draw, plus 3px.
function moved(legend, reach) {
  return {
    left: 0,
    bottom: 0,
    top: legend.top && reach.top ? reach.top + 3 : 0,
    right: legend.right && reach.right ? reach.right + 3 : 0,
  };
}

// Moves the edge of a recorded position scale where its axis is drawn on a side, such as the top
// of a grid of cells rather than the top of the frame.
function edge(record, side, value) {
  Object.defineProperty(record, "edges", {value: {...record.edges, [side]: value}, configurable: true});
}

// Maps the positions of a recorded position scale linearly, by k * p + b, after it's applied, such
// as those of a parent of a grid of cells scaled to keep room at its edges.
function warp(record, k, b) {
  const f = (p) => k * p + b;
  f.k = k;
  f.b = b;
  Object.defineProperty(record, "warp", {value: f, configurable: true});
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
