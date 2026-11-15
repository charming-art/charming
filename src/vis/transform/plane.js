import {InternSet} from "d3-array";
import {fit} from "../../core/transform/fit.js";
import {discrete, scale} from "../../core/transform/scale.js";
import {
  axisHint,
  callable,
  colorScales,
  hasAny,
  keysOf,
  labeled,
  positionRecord,
  positionScale,
  resolve,
  scaleDescriptors,
  withoutHints,
  withSeries,
} from "./scales.js";

// Like Plot, the height is 400 for a continuous y, 20px per category (up to 60) plus 60 for a
// categorical y, and 60 without y.
function autoHeight(value, keys, {type, domain, band}) {
  if (!hasAny(value, keys)) return 60;
  const V = keys.filter((key) => key in value).flatMap((key) => Array.from(value[key]));
  const categories = band?.domain ?? (discrete(type, V) ? (domain ?? Array.from(new InternSet(V))) : null);
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
    typeX,
    typeY,
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
  // A position counts if it's encoded, or if a channel shares its scale, such as {value: "v2", scale: "y"}.
  const {value: first = {}, hints: firstHints = {}} = data[0] ?? {};
  const firstX = keysOf(first, firstHints, keysX, "x");
  const firstY = keysOf(first, firstHints, keysY, "y");
  const hasX = hasAny(first, firstX);
  const hasY = hasAny(first, firstY);
  marginTop ??= margin ?? (hasY ? 20 : 0);
  marginRight ??= margin ?? 20;
  marginBottom ??= margin ?? (hasX ? 30 : 20);
  marginLeft ??= margin ?? (hasY ? 40 : 20);

  const {auto, width: rendererWidth, height: rendererHeight} = renderer._props;
  width ??= auto?.width ? 640 : rendererWidth;
  // The height uses the same scale and domain of y as fitting: the options, else the hints.
  const sizeY = {...axisHint(firstHints, keysY), ...(typeY && {type: typeY}), ...(domainY && {domain: domainY})};
  height ??= auto?.height ? autoHeight(first, firstY, sizeY) : rendererHeight;
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
    const [colored] = scale(flow, [context], scaleDescriptors(colors));

    // The scales of x and y also map the channels that share them, such as {value: "v2", scale: "y"}.
    const allX = keysOf(value, hints, keysX, "x");
    const allY = keysOf(value, hints, keysY, "y");
    const hintX = axisHint(hints, keysX);
    const hintY = axisHint(hints, keysY);
    const x = positionScale(value, allX, {type: typeX ?? hintX.type, domain: domainX ?? hintX.domain, range: rangeX});
    const y = positionScale(value, allY, {type: typeY ?? hintY.type, domain: domainY ?? hintY.domain, range: rangeY});

    const [fitted] = fit(flow, [colored], {
      scaleX: x.type,
      scaleY: y.type,
      domainX: x.domain,
      domainY: y.domain,
      reverseX,
      reverseY,
      marginTop,
      marginRight,
      marginBottom,
      marginLeft,
      keysX: allX,
      keysY: allY,
    });

    const scales = {...context.scales};
    for (const key in colors) scales[key] = labeled(resolve(colors[key]), hints[key]);
    const recordX = callable(labeled(positionRecord(x, rangeX, hintX), hintX));
    const recordY = callable(labeled(positionRecord(y, rangeY, hintY), hintY));
    // The scale is recorded as x or y, for axes, even if only channels that share it are encoded.
    if (hasAny(value, allX)) scales[keysX[0]] = recordX;
    if (hasAny(value, allY)) scales[keysY[0]] = recordY;
    for (const key of allX) if (key in value) scales[key] = recordX;
    for (const key of allY) if (key in value) scales[key] = recordY;

    const newValue = {...fitted.value};
    if (hasAny(value, allX) && !hasAny(value, allY))
      newValue[keysY[0]] = middle(value, allX, [frame.top, frame.bottom]);
    if (hasAny(value, allY) && !hasAny(value, allX))
      newValue[keysX[0]] = middle(value, allY, [frame.left, frame.right]);
    return {...withoutHints(fitted), value: newValue, scales, frame};
  });
}
