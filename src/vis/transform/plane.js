import {InternSet, sort} from "d3-array";
import {fit} from "../../core/transform/fit.js";
import {discrete, domainOf, scale} from "../../core/transform/scale.js";
import {isColor} from "../color.js";
import {schemeCategory} from "../scheme.js";

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
function withoutHints(context) {
  const newContext = {...context};
  delete newContext.hints;
  return newContext;
}

// A resolved scale, such as {scale: "linear", domain: [0, 10], range: [0, 100]}, for axes and legends.
function resolve({scale, domain, range}) {
  if (typeof scale !== "function") return {scale, domain, range};
  const s = scale.copy().domain(domain);
  if (range !== undefined) s.range(range);
  return {scale: s, domain, range: s.range()};
}

// The scales of the hinted color channels, categorical by default.
function colorScales(value, hints) {
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
function positionScale(value, keys, {scale, domain, range}) {
  const V = keys.filter((key) => key in value).flatMap((key) => Array.from(value[key]));
  if (domain === undefined) domain = domainOf(scale, V);
  // cm.fit maps discrete positions with a point scale, unless a d3 scale is given.
  const type = typeof scale === "function" ? scale : discrete(scale, V) ? "point" : "linear";
  return {scale, domain, range, type};
}

// The hint of an axis merges the hints of its keys, such as x and x1; the first key wins.
function axisHint(hints, keys) {
  return Object.assign({}, ...keys.slice().reverse().map((key) => hints[key]));
}

// Resolves the scales of the channels, and fits positions to the renderer like cm.fit, with y
// up and the default margins of a chart. The resolved scales are kept in context.scales.
export function plane(
  flow,
  data,
  {
    scaleX,
    scaleY,
    domainX,
    domainY,
    reverseX = false,
    reverseY = true,
    margin,
    marginTop = margin ?? 20,
    marginRight = margin ?? 20,
    marginBottom = margin ?? 30,
    marginLeft = margin ?? 40,
    keysX = ["x", "x1"],
    keysY = ["y", "y1"],
  } = {},
) {
  if (!data) throw new Error("No channels: call flow.transform(cm.encode, channels) before cm.plane.");
  const renderer = flow.renderer();
  if (!renderer) throw new Error("No renderer: call flow.renderer(renderer) before cm.plane.");
  const {width, height} = renderer._props;
  const rangeX = [marginLeft, width - marginRight];
  const rangeY = [marginTop, height - marginBottom];

  if (reverseX) rangeX.reverse();
  if (reverseY) rangeY.reverse();

  return data.map((context) => {
    const {value, hints = {}} = context;
    const colors = colorScales(value, hints);
    const [colored] = scale(flow, [context], colors);

    const {scale: hintScaleX, domain: hintDomainX} = axisHint(hints, keysX);
    const {scale: hintScaleY, domain: hintDomainY} = axisHint(hints, keysY);
    const x = positionScale(value, keysX, {scale: scaleX ?? hintScaleX, domain: domainX ?? hintDomainX, range: rangeX});
    const y = positionScale(value, keysY, {scale: scaleY ?? hintScaleY, domain: domainY ?? hintDomainY, range: rangeY});

    const [fitted] = fit(flow, [colored], {
      scaleX: x.scale,
      scaleY: y.scale,
      domainX: x.domain,
      domainY: y.domain,
      reverseX,
      reverseY,
      marginTop,
      marginRight,
      marginBottom,
      marginLeft,
      keysX,
      keysY,
    });

    const scales = {...context.scales};
    for (const key in colors) scales[key] = resolve(colors[key]);
    for (const key of keysX) if (key in value) scales[key] = resolve({scale: x.type, domain: x.domain, range: rangeX});
    for (const key of keysY) if (key in value) scales[key] = resolve({scale: y.type, domain: y.domain, range: rangeY});
    return {...withoutHints(fitted), scales};
  });
}
