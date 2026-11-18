import {scaleRadial} from "d3-scale";
import {arc} from "d3-shape";
import {axisX, axisY} from "../shape/axis.js";
import {legend, topLegends} from "../shape/legend.js";
import {point, scale} from "../../core/transform/scale.js";
import {
  allKeysOf,
  axisHint,
  byScaleName,
  callable,
  channelHints,
  channelScales,
  guideMarks,
  guidesOf,
  hasAny,
  isNested,
  keysOf,
  labeled,
  merge,
  nestedFrames,
  positionRecord,
  positionOptions,
  positionScale,
  resolve,
  scaleDescriptors,
  scaleName,
  scaledKeys,
  sharedScale,
  withoutHints,
  withScaleOptions,
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

// The sides of the axes of cm.polar: the angle axis on its default ring with axis true, outside it
// and inside the hole with "both"; the radius axis has one side.
const sidesOfPolar = {x: {first: undefined, both: ["outer", "inner"]}, y: {first: undefined, both: [undefined]}};

// Resolves the scales of the channels, and maps positions to polar coordinates: x to the angle,
// clockwise from 12 o'clock like d3.arc, and y to the radius, with a radial scale so that areas
// grow with values. A pie is then a stack along x, and a rose a spread along x. The center is
// kept in cx and cy for cm.arc. A renderer without a given size is resized to 640 × 640. As in
// cm.plane, the scales are resolved once for all the contexts, unless resolve makes a position
// independent, and a nested context is drawn in the frame of its parent row, such as a pie glyph
// in a width × height box. The resolved scales are kept in context.scales, and the polar frame in
// context.frame. With clip, the marks are clipped to the frame: its disc, ring or sector, unless a
// mark gives its own clip option, as in cm.plane. As in cm.plane, the options of scales are given by
// name, such as {y: {type: "linear"}} for the radius, and colors, radii and opacities, with their
// guides; unlike it, a polar chart draws no axes unless asked, such as {x: {axis: true}}.
export function polar(
  flow,
  data,
  {
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
    resolve: resolution = {},
    clip = false,
    keysX = ["x", "x1"],
    keysY = ["y", "y1"],
    // The other options are the options of scales, by name, such as y, fill or a named radius.
    ...options
  } = {},
) {
  if (!data) throw new Error("No channels: call flow.transform(cm.encode, channels) before cm.polar.");
  const renderer = flow.renderer();
  if (!renderer) throw new Error("No renderer: call flow.renderer(renderer) before cm.polar.");
  const nested = isNested(flow);
  data = data.map((context) =>
    withScaleOptions(withSeries(context), options, [
      [keysX, "x"],
      [keysY, "y"],
    ]),
  );

  // A nested chart has no margins by default: its parent leaves the room. The colors are resolved
  // before the frame, so that the legends at the top, measured from the left of the chart, are given
  // room over the margin.
  const colors = channelScales(merge(data, scaledKeys), channelHints(data));
  if (!nested) width ??= renderer._props.auto?.width ? 640 : renderer._props.width;
  const legendRoom = nested ? 0 : topLegends(data, colors, options, width - 3 - (marginLeft ?? margin ?? 40));
  margin ??= nested ? 0 : 40;
  marginTop ??= margin + legendRoom;
  marginRight ??= margin;
  marginBottom ??= margin;
  marginLeft ??= margin;

  let boxes;
  if (nested) {
    boxes = nestedFrames(flow, data, {width, height});
  } else {
    const {auto, height: rendererHeight} = renderer._props;
    height ??= auto?.height ? 640 : rendererHeight;
    renderer.resize?.(width, height);
    ({width, height} = renderer._props);
    boxes = data.map(() => ({left: 0, right: width, top: 0, bottom: height}));
  }
  const frames = boxes.map(({left, right, top, bottom, nested}) => {
    const l = left + marginLeft;
    const r = right - marginRight;
    const t = top + marginTop;
    const b = bottom - marginBottom;
    const outerRadius = Math.max(0, Math.min(r - l, b - t) / 2);
    const r0 = innerRadius * outerRadius;
    // The left of the box inside the margins is kept for the legends at the top, which start there.
    const frame = {type: "polar", cx: (l + r) / 2, cy: (t + b) / 2, innerRadius: r0, outerRadius, startAngle, endAngle};
    frame.left = l;
    // Like cm.plane's, a nested frame is marked, so that its axes leave titles to the outer chart.
    return nested ? {...frame, nested} : frame;
  });
  // The scales shared by all the contexts: colors, and positions unless they're independent.
  // Like cm.plane, a position is shared by the name of its scale, the axis by default.
  const independent = (name) => resolution[name] === "independent";
  // The type and domain of a position: the options of its scale, unless it has bands, else its
  // hint; the radius is radial by default, so that areas grow with values.
  const positionOf = (hints, keys, name, fallback) => {
    const own = positionOptions(hints, options[name]);
    return {type: radial(own.type ?? hints[0]?.type ?? fallback), domain: own.domain};
  };
  const sharedOf = (keys, axis, fallback) =>
    new Map(
      Array.from(byScaleName(data, keys, axis), ([name, contexts]) => {
        if (independent(name)) return [name, null];
        const all = allKeysOf(contexts, keys, axis);
        const hints = contexts.map(({hints = {}}) => axisHint(hints, keys));
        const {type, domain} = positionOf(hints, keys, name, fallback);
        return [name, sharedScale(contexts, all, keys, {type, domain})];
      }),
    );
  const sharedX = sharedOf(keysX, "x");
  const sharedY = sharedOf(keysY, "y", "radial");

  // The id of the chart's guides, which tells them apart from the guides of other charts.
  const id = {};
  return data.map((context, j) => {
    const {value, hints = {}} = context;
    // The channels of this context's scales: its positions, and the channels that join them here.
    const ownKeysX = keysOf(value, hints, keysX, "x");
    const ownKeysY = keysOf(value, hints, keysY, "y");
    const frame = frames[j];
    const {cx, cy, innerRadius: r0, outerRadius} = frame;
    const hintX = axisHint(hints, keysX);
    const hintY = axisHint(hints, keysY);
    const nameX = scaleName(hints, keysX, "x");
    const nameY = scaleName(hints, keysY, "y");
    // Reversed, the angles go counterclockwise, and large values sit near the center.
    const rangeX = hintX.reverse ? [endAngle, startAngle] : [startAngle, endAngle];
    const rangeY = hintY.reverse ? [outerRadius, r0] : [r0, outerRadius];
    const ownX = positionOf([hintX], keysX, nameX);
    const ownY = positionOf([hintY], keysY, nameY, "radial");
    const x = sharedX.get(nameX) || positionScale(value, ownKeysX, {...ownX, domain: ownX.domain ?? hintX.domain});
    const y = sharedY.get(nameY) || positionScale(value, ownKeysY, {...ownY, domain: ownY.domain ?? hintY.domain});

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

    // A missing position fills its span: a pie has no y, so its wedges span the whole radius. Like a
    // stack, y is the outer radius and y1 the baseline.
    const newValue = {...scaled.value};
    const n = Object.values(value)[0]?.length ?? 0; // all channels have one value per row
    // A missing position spans the frame whichever way its scale goes.
    if (!hasAny(value, ownKeysY)) [newValue[keysY[1]], newValue[keysY[0]]] = span(n, [r0, outerRadius]); // y outer, y1 inner
    if (!hasAny(value, ownKeysX)) [newValue[keysX[0]], newValue[keysX[1]]] = span(n, [startAngle, endAngle]);
    newValue.cx = Array.from({length: n}, () => cx);
    newValue.cy = Array.from({length: n}, () => cy);
    // As in cm.plane, the frame is kept as a clip shape, and the clip option is the default of marks.
    const shape = {x: frame.cx, y: frame.cy, d: arc()(frame)};
    // Unlike cm.plane's, the axes of cm.polar are titled only by labels given to scales, such as
    // {y: {label: "Population"}}, not by field names, so that radial charts stay uncluttered.
    const titles = {x: options[nameX]?.label, y: options[nameY]?.label};
    // Unlike cm.plane, cm.polar draws axes only when asked, such as {x: {axis: true}}, as pies and
    // donuts have none.
    const guides = guidesOf(id, options, nameX, nameY, sidesOfPolar, {x: [], y: []});
    return {...withoutHints(scaled), value: newValue, scales, frame, titles, clip: shape, clipped: clip, guides};
  });
}

// The axes and legends that a polar chart draws, when asked, before the shapes added to it.
polar.marks = (values) => guideMarks(values, {axisX, axisY, legend});
