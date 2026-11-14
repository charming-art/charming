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

// The scale recorded for a position: the band of cm.spreadX if any, so that axes can label its
// categories, or the scale applied by cm.fit.
function positionRecord({type, domain}, range, {band}) {
  if (band) return {scale: "band", ...band, range};
  return resolve({scale: type, domain, range});
}

// The label of a channel, such as its field name, for axes and legends.
function labeled(scale, {label} = {}) {
  return label === undefined ? scale : {...scale, label};
}

// The hint of an axis merges the hints of its keys, such as x and x1; the first key wins.
function axisHint(hints, keys) {
  return Object.assign(
    {},
    ...keys
      .slice()
      .reverse()
      .map((key) => hints[key]),
  );
}

function hasAny(value, keys) {
  return keys.some((key) => key in value);
}

// Like Plot, the height is 400 for a continuous y, 20px per category (up to 60) plus 60 for a
// categorical y, and 60 without y.
function autoHeight(value, keys, {scale, domain, band}) {
  if (!hasAny(value, keys)) return 60;
  const V = keys.filter((key) => key in value).flatMap((key) => Array.from(value[key]));
  const categories = band?.domain ?? (discrete(scale, V) ? (domain ?? Array.from(new InternSet(V))) : null);
  return categories ? Math.min(60, categories.length) * 20 + 60 : 400;
}

// Rows at the middle of the frame, for a position that isn't encoded, such as y in a dot plot of
// x. The rows are counted from the encoded position, which may be a typed array.
function middle(value, keys, [start, end]) {
  const n = value[keys.find((key) => key in value)].length;
  return Array.from({length: n}, () => (start + end) / 2);
}

// Resolves the scales of the channels, and fits positions to the renderer like cm.fit, with y
// up and the default margins of a chart. A renderer without a given size is resized, like Plot:
// 640 wide, with a height that depends on y. The resolved scales are kept in context.scales, and
// the chart area in context.frame.
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
    width,
    height,
    margin,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    keysX = ["x", "x1"],
    keysY = ["y", "y1"],
  } = {},
) {
  if (!data) throw new Error("No channels: call flow.transform(cm.encode, channels) before cm.plane.");
  const renderer = flow.renderer();
  if (!renderer) throw new Error("No renderer: call flow.renderer(renderer) before cm.plane.");

  // The margins leave room for the axes of the encoded positions.
  const {value: first = {}, hints: firstHints = {}} = data[0] ?? {};
  const hasX = hasAny(first, keysX);
  const hasY = hasAny(first, keysY);
  marginTop ??= margin ?? (hasY ? 20 : 0);
  marginRight ??= margin ?? 20;
  marginBottom ??= margin ?? (hasX ? 30 : 20);
  marginLeft ??= margin ?? (hasY ? 40 : 20);

  const {auto, width: rendererWidth, height: rendererHeight} = renderer._props;
  width ??= auto?.width ? 640 : rendererWidth;
  // The height uses the same scale and domain of y as fitting: the options, else the hints.
  const sizeY = {...axisHint(firstHints, keysY), ...(scaleY && {scale: scaleY}), ...(domainY && {domain: domainY})};
  height ??= auto?.height ? autoHeight(first, keysY, sizeY) : rendererHeight;
  renderer.resize?.(width, height);
  ({width, height} = renderer._props);

  const frame = {top: marginTop, right: width - marginRight, bottom: height - marginBottom, left: marginLeft};
  const rangeX = [marginLeft, width - marginRight];
  const rangeY = [marginTop, height - marginBottom];

  if (reverseX) rangeX.reverse();
  if (reverseY) rangeY.reverse();

  return data.map((context) => {
    const {value, hints = {}} = context;
    const colors = colorScales(value, hints);
    const [colored] = scale(flow, [context], colors);

    const hintX = axisHint(hints, keysX);
    const hintY = axisHint(hints, keysY);
    const {scale: hintScaleX, domain: hintDomainX} = hintX;
    const {scale: hintScaleY, domain: hintDomainY} = hintY;
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
    for (const key in colors) scales[key] = labeled(resolve(colors[key]), hints[key]);
    const recordX = labeled(positionRecord(x, rangeX, hintX), hintX);
    const recordY = labeled(positionRecord(y, rangeY, hintY), hintY);
    for (const key of keysX) if (key in value) scales[key] = recordX;
    for (const key of keysY) if (key in value) scales[key] = recordY;

    const newValue = {...fitted.value};
    if (hasAny(value, keysX) && !hasAny(value, keysY))
      newValue[keysY[0]] = middle(value, keysX, [frame.top, frame.bottom]);
    if (hasAny(value, keysY) && !hasAny(value, keysX))
      newValue[keysX[0]] = middle(value, keysY, [frame.left, frame.right]);
    return {...withoutHints(fitted), value: newValue, scales, frame};
  });
}
