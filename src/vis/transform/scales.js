import {InternSet, sort} from "d3-array";
import {scaleBand, scaleLinear, scalePoint, scaleUtc} from "d3-scale";
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

// The scales of the hinted color channels, categorical by default.
export function colorScales(value, hints) {
  const scales = {};
  for (const key of colorKeys) {
    if (!(key in hints) || !(key in value)) continue;
    const {type, domain, range} = hints[key];
    const V = value[key];
    if (type === undefined && domain === undefined && range === undefined && (isNumeric(V) || isIdentity(V))) {
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
export function scaleOf({type, domain, range, paddingInner, paddingOuter, align}) {
  if (typeof type === "function") return type;
  if (type === "band")
    return scaleBand(domain, range).paddingInner(paddingInner).paddingOuter(paddingOuter).align(align);
  if (type === "point") return scalePoint(domain, range);
  if (type === "utc") return scaleUtc(domain, range);
  return scaleLinear(domain, range);
}

// Gives a recorded position scale apply and invert, like the scales of Plot: apply maps a value to
// pixels, or to an angle or radius in polar, at the middle of its band if any. They aren't
// enumerable, so that records stay plain values.
export function callable(record) {
  const scale = scaleOf(record);
  const offset = scale.bandwidth ? scale.bandwidth() / 2 : 0;
  const properties = {apply: {value: (v) => scale(v) + offset}};
  if (scale.invert) properties.invert = {value: (p) => scale.invert(p)};
  return Object.defineProperties(record, properties);
}

// The keys of a position scale: its own, such as x and x1, and the channels that share it, such as
// {value: "v2", scale: "y"}.
export function keysOf(value, hints, keys, name) {
  const shared = Object.keys(value).filter((key) => !keys.includes(key) && hints[key]?.scale === name);
  return [...keys, ...shared];
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
