import {InternSet, sort} from "d3-array";
import {discrete, domainOf} from "../../core/transform/scale.js";
import {isColor} from "../color.js";
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

// A resolved scale, such as {scale: "linear", domain: [0, 10], range: [0, 100]}, for axes and legends.
export function resolve({scale, domain, range}) {
  if (typeof scale !== "function") return {scale, domain, range};
  const s = scale.copy().domain(domain);
  if (range !== undefined) s.range(range);
  return {scale: s, domain, range: s.range()};
}

// The scales of the hinted color channels, categorical by default.
export function colorScales(value, hints) {
  const scales = {};
  for (const key of colorKeys) {
    if (!(key in hints) || !(key in value)) continue;
    const {scale, domain, range} = hints[key];
    const V = value[key];
    if (scale === undefined && domain === undefined && range === undefined && (isNumeric(V) || isIdentity(V))) {
      continue;
    }
    const ordinal = scale === undefined || scale === "ordinal";
    scales[key] = {
      scale: scale ?? "ordinal",
      domain: domain ?? (ordinal ? sort(new InternSet(V)) : domainOf(scale, V)),
      range: range ?? (ordinal ? schemeCategory : undefined),
    };
  }
  return scales;
}

// The scale shared by position channels such as x and x1, with the domain inferred from all of them.
export function positionScale(value, keys, {scale, domain, range}) {
  const V = keys.filter((key) => key in value).flatMap((key) => Array.from(value[key]));
  if (domain === undefined) domain = domainOf(scale, V);
  // cm.fit maps discrete positions with a point scale, unless a d3 scale is given.
  const type = typeof scale === "function" ? scale : discrete(scale, V) ? "point" : "linear";
  return {scale, domain, range, type};
}

// The scale recorded for a position: the band of cm.spreadX if any, so that axes can label its
// categories, or the scale applied by cm.fit.
export function positionRecord({type, domain}, range, {band}) {
  if (band) return {scale: "band", ...band, range};
  return resolve({scale: type, domain, range});
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
