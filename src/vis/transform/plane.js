import {InternSet} from "d3-array";
import {fit} from "../../core/transform/fit.js";
import {discrete, scale} from "../../core/transform/scale.js";
import {
  axisHint,
  colorScales,
  hasAny,
  labeled,
  positionRecord,
  positionScale,
  resolve,
  withoutHints,
  withSeries,
} from "./scales.js";

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
    reverseY,
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

  // Values grow upward, but categories in bands go down from the top, like Plot's ordinal y.
  reverseY ??= !axisHint(firstHints, keysY).band;

  const frame = {top: marginTop, right: width - marginRight, bottom: height - marginBottom, left: marginLeft};
  const rangeX = [marginLeft, width - marginRight];
  const rangeY = [marginTop, height - marginBottom];

  if (reverseX) rangeX.reverse();
  if (reverseY) rangeY.reverse();

  return data.map((context) => {
    context = withSeries(context);
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
