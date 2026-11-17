import {InternSet} from "d3-array";
import {discrete, point, scale} from "../../core/transform/scale.js";
import {
  allKeysOf,
  axisHint,
  byScaleName,
  callable,
  colorScales,
  hasAny,
  isNested,
  keysOf,
  labeled,
  merge,
  nestedFrames,
  positionRecord,
  positionScale,
  resolve,
  scaleDescriptors,
  scaleName,
  sharedDomain,
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

// Resolves the scales of the channels, and maps positions to the chart area with y up and the
// default margins of a chart. A renderer without a given size is resized, like Plot: 640 wide, with
// a height that depends on y. The scales are resolved once for all the contexts, so that facets
// compare; with resolve, a position can be inferred per context instead. Colors are always shared.
// In a nested flow, such as one chart per row of a parent mark, each context is drawn in the frame
// of its parent row: the cell of a band, or a width × height box around a point. The resolved
// scales are kept in context.scales, and the chart area in context.frame. With clip, the marks are
// clipped to the frame, like Plot's clip, such as bars sliding in from outside it; axes aren't.
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
    resolve: resolution = {},
    clip = false,
    keysX = ["x", "x1"],
    keysY = ["y", "y1"],
  } = {},
) {
  if (!data) throw new Error("No channels: call flow.transform(cm.encode, channels) before cm.plane.");
  const renderer = flow.renderer();
  if (!renderer) throw new Error("No renderer: call flow.renderer(renderer) before cm.plane.");
  const nested = isNested(flow);
  data = data.map(withSeries);

  // The margins leave room for the axes of the positions encoded in any context, such as a layer
  // of branches. A position counts if it's encoded, or if a channel shares its scale, such as
  // {value: "v2", scale: "y"}. A nested chart has no margins by default: its parent's margins and
  // bands leave the room. The size and direction of y come from the first context with y.
  const has = ({value, hints = {}}, keys, name) => hasAny(value, keysOf(value, hints, keys, name));
  const hasX = data.some((context) => has(context, keysX, "x"));
  const hasY = data.some((context) => has(context, keysY, "y"));
  const {value: first = {}, hints: firstHints = {}} = data.find((context) => has(context, keysY, "y")) ?? data[0] ?? {};
  const firstY = keysOf(first, firstHints, keysY, "y");
  marginTop ??= margin ?? (nested ? 0 : hasY ? 20 : 0);
  marginRight ??= margin ?? (nested ? 0 : 20);
  marginBottom ??= margin ?? (nested ? 0 : hasX ? 30 : 20);
  marginLeft ??= margin ?? (nested ? 0 : hasY ? 40 : 20);

  // Values grow upward, but categories in bands go down from the top, like Plot's ordinal y. An
  // independent y points its own way in each context.
  const reverseOf = (hints) => reverseY ?? !axisHint(hints, keysY).band;

  let frames;
  if (nested) {
    frames = nestedFrames(flow, data, {width, height}).map((frame) => ({
      ...frame,
      top: frame.top + marginTop,
      right: frame.right - marginRight,
      bottom: frame.bottom - marginBottom,
      left: frame.left + marginLeft,
    }));
  } else {
    const {auto, width: rendererWidth, height: rendererHeight} = renderer._props;
    width ??= auto?.width ? 640 : rendererWidth;
    // The height uses the same scale and domain of y as fitting: the options, else the hints.
    const sizeY = {...axisHint(firstHints, keysY), ...(typeY && {type: typeY}), ...(domainY && {domain: domainY})};
    height ??= auto?.height ? autoHeight(first, firstY, sizeY) : rendererHeight;
    renderer.resize?.(width, height);
    ({width, height} = renderer._props);
    const frame = {top: marginTop, right: width - marginRight, bottom: height - marginBottom, left: marginLeft};
    frames = data.map(() => frame);
  }

  // The scales shared by the contexts: colors, and positions unless they're independent. A position
  // is shared with the contexts whose positions use the same scale: the axis, by default, or a name
  // given to it, such as x: {value: "culmen_length_mm", scale: "length"}. The options apply to the
  // scale named after the axis, and resolve takes any name, such as {x: "independent"}.
  const colors = colorScales(merge(data, ["fill", "stroke"]), data[0]?.hints ?? {});
  const independent = (name) => resolution[name] === "independent";
  const sharedOf = (keys, axis, type, domain) =>
    new Map(
      Array.from(byScaleName(data, keys, axis), ([name, contexts]) => {
        if (independent(name)) return [name, null];
        const own = name === axis;
        const all = allKeysOf(contexts, keys, axis);
        return [name, sharedScale(contexts, all, keys, own ? type : undefined, own ? domain : undefined)];
      }),
    );
  const sharedX = sharedOf(keysX, "x", typeX, domainX);
  const sharedY = sharedOf(keysY, "y", typeY, domainY);
  // The direction of a shared y comes from the first of its contexts with y.
  const firstHintsY = new Map(
    Array.from(byScaleName(data, keysY, "y"), ([name, contexts]) => [
      name,
      (contexts.find((context) => has(context, keysY, "y")) ?? contexts[0]).hints ?? {},
    ]),
  );

  return data.map((context, j) => {
    const {value, hints = {}} = context;
    // The channels of this context's scales: its positions, and the channels that join them here.
    const ownKeysX = keysOf(value, hints, keysX, "x");
    const ownKeysY = keysOf(value, hints, keysY, "y");
    const frame = frames[j];
    const rangeX = [frame.left, frame.right];
    const rangeY = [frame.top, frame.bottom];
    if (reverseX) rangeX.reverse();
    const nameX = scaleName(hints, keysX, "x");
    const nameY = scaleName(hints, keysY, "y");
    if (reverseOf(independent(nameY) ? hints : firstHintsY.get(nameY))) rangeY.reverse();

    // An independent position is inferred from its own context, with the options if it's the axis's.
    const hintX = axisHint(hints, keysX);
    const hintY = axisHint(hints, keysY);
    const [ownX, ownY] = [nameX === "x", nameY === "y"];
    const x =
      sharedX.get(nameX) ||
      positionScale(value, ownKeysX, {
        type: (ownX ? typeX : undefined) ?? hintX.type,
        domain: (ownX ? domainX : undefined) ?? hintX.domain,
      });
    const y =
      sharedY.get(nameY) ||
      positionScale(value, ownKeysY, {
        type: (ownY ? typeY : undefined) ?? hintY.type,
        domain: (ownY ? domainY : undefined) ?? hintY.domain,
      });

    // Colors are categorical by default, and positions are discrete points by default.
    const [colored] = scale(flow, [context], scaleDescriptors(colors));
    const descriptors = {};
    for (const key of ownKeysX) if (key in value) descriptors[key] = {scale: x.type, domain: x.domain, range: rangeX};
    for (const key of ownKeysY) if (key in value) descriptors[key] = {scale: y.type, domain: y.domain, range: rangeY};
    const [scaled] = scale(flow, [colored], descriptors, point);

    const scales = {...context.scales};
    for (const key in colors) scales[key] = labeled(resolve(colors[key]), hints[key]);
    const recordX = callable(labeled(positionRecord(x, rangeX, hintX), hintX));
    const recordY = callable(labeled(positionRecord(y, rangeY, hintY), hintY));
    // The scale is recorded as x or y, for axes, even if only channels that share it are encoded.
    if (hasAny(value, ownKeysX)) scales[keysX[0]] = recordX;
    if (hasAny(value, ownKeysY)) scales[keysY[0]] = recordY;
    for (const key of ownKeysX) if (key in value) scales[key] = recordX;
    for (const key of ownKeysY) if (key in value) scales[key] = recordY;

    const newValue = {...scaled.value};
    if (hasAny(value, ownKeysX) && !hasAny(value, ownKeysY))
      newValue[keysY[0]] = middle(value, ownKeysX, [frame.top, frame.bottom]);
    if (hasAny(value, ownKeysY) && !hasAny(value, ownKeysX))
      newValue[keysX[0]] = middle(value, ownKeysY, [frame.left, frame.right]);
    const {left, top, right, bottom} = frame;
    const clipped = clip ? {clip: {x: left, y: top, width: right - left, height: bottom - top}} : {};
    return {...withoutHints(scaled), value: newValue, scales, frame, ...clipped};
  });
}

// The scale of a position shared by the contexts: its type and domain from the options, else from
// the hints of the contexts, else inferred from the values of all of them.
function sharedScale(data, all, keys, type, domain) {
  const hints = data.map(({hints = {}}) => axisHint(hints, keys));
  type ??= hints[0]?.type;
  const values = merge(data, all);
  domain ??= sharedDomain(
    hints.map((hint) => hint.domain),
    type ?? hints[0]?.type,
    all.flatMap((key) => values[key] ?? []),
  );
  return positionScale(values, all, {type, domain});
}
