import {scaleRadial} from "d3-scale";
import {point, scale} from "../../core/transform/scale.js";
import {
  axisHint,
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
  sharedDomain,
  withoutHints,
  withSeries,
} from "./scales.js";

// Rows from start to end, for a position that isn't encoded, such as the radius of a pie.
function span(n, [start, end]) {
  return [Array.from({length: n}, () => start), Array.from({length: n}, () => end)];
}

// The radial scale can be named, like the other types of scales.
function radial(type) {
  return type === "radial" ? scaleRadial() : type;
}

// Resolves the scales of the channels, and maps positions to polar coordinates: x to the angle,
// clockwise from 12 o'clock like d3.arc, and y to the radius, with a radial scale so that areas
// grow with values. A pie is then a stack along x, and a rose a spread along x. The center is
// kept in cx and cy for cm.arc. A renderer without a given size is resized to 640 × 640. As in
// cm.plane, the scales are resolved once for all the contexts, unless resolve makes a position
// independent, and a nested context is drawn in the frame of its parent row, such as a pie glyph
// in a width × height box. The resolved scales are kept in context.scales, and the polar frame in
// context.frame.
export function polar(
  flow,
  data,
  {
    typeX,
    typeY,
    domainX,
    domainY,
    innerRadius = 0,
    startAngle = 0,
    endAngle = 2 * Math.PI,
    width,
    height,
    margin,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    resolve: {x: resolveX = "shared", y: resolveY = "shared"} = {},
    keysX = ["x", "x1"],
    keysY = ["y", "y1"],
  } = {},
) {
  if (!data) throw new Error("No channels: call flow.transform(cm.encode, channels) before cm.polar.");
  const renderer = flow.renderer();
  if (!renderer) throw new Error("No renderer: call flow.renderer(renderer) before cm.polar.");
  const nested = isNested(flow);
  data = data.map(withSeries);

  // A nested chart has no margins by default: its parent leaves the room.
  margin ??= nested ? 0 : 40;
  marginTop ??= margin;
  marginRight ??= margin;
  marginBottom ??= margin;
  marginLeft ??= margin;

  let boxes;
  if (nested) {
    boxes = nestedFrames(flow, data.length, {width, height});
  } else {
    const {auto, width: rendererWidth, height: rendererHeight} = renderer._props;
    width ??= auto?.width ? 640 : rendererWidth;
    height ??= auto?.height ? 640 : rendererHeight;
    renderer.resize?.(width, height);
    ({width, height} = renderer._props);
    boxes = data.map(() => ({left: 0, right: width, top: 0, bottom: height}));
  }
  const frames = boxes.map(({left, right, top, bottom}) => {
    const l = left + marginLeft;
    const r = right - marginRight;
    const t = top + marginTop;
    const b = bottom - marginBottom;
    const outerRadius = Math.max(0, Math.min(r - l, b - t) / 2);
    const r0 = innerRadius * outerRadius;
    return {type: "polar", cx: (l + r) / 2, cy: (t + b) / 2, innerRadius: r0, outerRadius, startAngle, endAngle};
  });
  const rangeX = [startAngle, endAngle];

  // The scales shared by all the contexts: colors, and positions unless they're independent.
  const {hints: firstHints = {}} = data[0] ?? {};
  const allX = Array.from(new Set(data.flatMap(({value, hints = {}}) => keysOf(value, hints, keysX, "x"))));
  const allY = Array.from(new Set(data.flatMap(({value, hints = {}}) => keysOf(value, hints, keysY, "y"))));
  const colors = colorScales(merge(data, ["fill", "stroke"]), firstHints);
  // The radius is radial by default, so that areas grow with values.
  const radialY = (hints) => radial(typeY ?? axisHint(hints, keysY).type ?? "radial");
  const sharedX = resolveX !== "independent" && sharedScale(data, allX, keysX, typeX, domainX);
  const sharedY = resolveY !== "independent" && sharedScale(data, allY, keysY, radialY(firstHints), domainY);

  return data.map((context, j) => {
    const {value, hints = {}} = context;
    const frame = frames[j];
    const {cx, cy, innerRadius: r0, outerRadius} = frame;
    const rangeY = [r0, outerRadius];

    const hintX = axisHint(hints, keysX);
    const hintY = axisHint(hints, keysY);
    const x = sharedX || positionScale(value, allX, {type: typeX ?? hintX.type, domain: domainX ?? hintX.domain});
    const y = sharedY || positionScale(value, allY, {type: radialY(hints), domain: domainY ?? hintY.domain});

    const [colored] = scale(flow, [context], scaleDescriptors(colors));
    const descriptors = {};
    for (const key of allX) if (key in value) descriptors[key] = {scale: x.type, domain: x.domain, range: rangeX};
    for (const key of allY) if (key in value) descriptors[key] = {scale: y.type, domain: y.domain, range: rangeY};
    const [scaled] = scale(flow, [colored], descriptors, point);

    const scales = {...context.scales};
    for (const key in colors) scales[key] = labeled(resolve(colors[key]), hints[key]);
    const recordX = callable(labeled(positionRecord(x, rangeX, hintX), hintX));
    const recordY = callable(labeled(positionRecord(y, rangeY, hintY), hintY));
    // The scale is recorded as x or y, for axes, even if only channels that share it are encoded.
    if (hasAny(value, allX)) scales[keysX[0]] = recordX;
    if (hasAny(value, allY)) scales[keysY[0]] = recordY;
    for (const key of allX) if (key in value) scales[key] = recordX;
    for (const key of allY) if (key in value) scales[key] = recordY;

    // A missing position fills its span: a pie has no y, so its wedges span the whole radius. Like a
    // stack, y is the outer radius and y1 the baseline.
    const newValue = {...scaled.value};
    const n = Object.values(value)[0]?.length ?? 0; // all channels have one value per row
    if (!hasAny(value, allY)) [newValue[keysY[1]], newValue[keysY[0]]] = span(n, rangeY); // y outer, y1 inner
    if (!hasAny(value, allX)) [newValue[keysX[0]], newValue[keysX[1]]] = span(n, rangeX);
    newValue.cx = Array.from({length: n}, () => cx);
    newValue.cy = Array.from({length: n}, () => cy);
    return {...withoutHints(scaled), value: newValue, scales, frame};
  });
}

// The scale of a position shared by the contexts: its type and domain from the options, else from
// the hints of the contexts, else inferred from the values of all of them.
function sharedScale(data, all, keys, type, domain) {
  const hints = data.map(({hints = {}}) => axisHint(hints, keys));
  const values = merge(data, all);
  domain ??= sharedDomain(
    hints.map((hint) => hint.domain),
    type ?? hints[0]?.type,
    all.flatMap((key) => values[key] ?? []),
  );
  return positionScale(values, all, {type: type ?? hints[0]?.type, domain});
}
