import {InternSet} from "d3-array";
import {discrete, point, scale} from "../../core/transform/scale.js";
import {axisX, axisY} from "../shape/axis.js";
import {legend} from "../shape/legend.js";
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

// Like Plot, the height is 400 for a continuous y; for a categorical y, a frame of 20px per
// category (up to 60) plus 10, and without y, a frame of 30px, each with the top and bottom margins
// of the chart, such as 70 without y with the default bottom axis, or more with an axis at the top.
function autoHeight(value, keys, {type, domain, band}, margins) {
  if (!hasAny(value, keys)) return 30 + margins;
  const V = keys.filter((key) => key in value).flatMap((key) => Array.from(value[key]));
  const categories = band?.domain ?? (discrete(type, V) ? (domain ?? Array.from(new InternSet(V))) : null);
  return categories ? Math.min(60, categories.length) * 20 + 10 + margins : 400;
}

// Rows at the middle of the frame, for a position that isn't encoded, such as y in a dot plot of
// x. The rows are counted from the encoded position, which may be a typed array.
function middle(value, keys, [start, end]) {
  const n = value[keys.find((key) => key in value)].length;
  return Array.from({length: n}, () => (start + end) / 2);
}

// The room of the components on each side of a chart, for its default margins: the axes of the
// positions encoded in any of its contexts, at the bottom and the left by default, and their
// titles, on the first side of each axis. An axis of x takes its tick marks and labels, 6 + 3 + 10
// and 5px to spare, and its title, 6 + 10; an axis of y, 6 + 3 and labels up to six characters
// wide, such as 14,000, and its title turned beside them at the middle, 24, or level at its top or
// bottom: 24 over or under the frame, or a row of 16 past an axis of x on that side, shared with
// its title. Without an axis, a side keeps room for the ends of the tick labels of the other axis,
// such as half a label of y over the frame.
function axisRoom(data, options, keysX, keysY, has) {
  const room = {top: 0, right: 0, bottom: 0, left: 0};
  const rows = {top: false, bottom: false};
  for (const context of data) {
    const {hints = {}} = context;
    const nameX = scaleName(hints, keysX, "x");
    const nameY = scaleName(hints, keysY, "y");
    const {x, y} = guidesOf(null, options, nameX, nameY, sidesOfPlane, {x: ["bottom"], y: ["left"]});
    const hintY = axisHint(hints, keysY);
    const titledX = axisHint(hints, keysX).label != null;
    const titledY = hintY.label != null;
    const V = keysY.filter((key) => key in context.value).flatMap((key) => Array.from(context.value[key]));
    const discreteY = hintY.band !== undefined || discrete(options[nameY]?.type ?? hintY.type, V);
    const labelAnchor = options[nameY]?.labelAnchor ?? (discreteY ? "center" : "top");
    if (has(context, keysX, "x")) {
      x.anchors.forEach((side, i) => {
        room[side] = Math.max(room[side], 24);
        if (i === 0 && titledX) rows[side] = true;
      });
    }
    if (has(context, keysY, "y")) {
      y.anchors.forEach((side, i) => {
        const titled = i === 0 && titledY;
        room[side] = Math.max(room[side], 46 + (titled && labelAnchor === "center" ? 24 : 0));
        if (titled && labelAnchor !== "center") rows[labelAnchor] = true;
      });
    }
  }
  // At the top or the bottom, an axis of x and a level title of y share a row of titles, past its
  // tick labels.
  for (const side of ["top", "bottom"]) {
    room[side] = room[side] ? room[side] + (rows[side] ? 16 : 0) : rows[side] ? 24 : 0;
  }
  return room;
}

// The sides of the axes of a plane: the first is the side of axis true, and both are "both".
const sidesOfPlane = {
  x: {first: "bottom", both: ["bottom", "top"]},
  y: {first: "left", both: ["left", "right"]},
};

// Resolves the scales of the channels, and maps positions to the chart area with y up and the
// default margins of a chart. A renderer without a given size is resized, like Plot: 640 wide, with
// a height that depends on y. The scales are resolved once for all the contexts, so that facets
// compare; with resolve, a position can be inferred per context instead. Colors are always shared.
// The options of scales are given by name, like Plot's: the type, domain, reverse and label of a
// position, such as {y: {domain: [0, 100]}} or a named {length: {type: "log"}}; the type, domain,
// range, scheme and label of a color, such as {fill: {scheme: "PiYG"}}; and the type, domain, range
// and label of a radius or an opacity, such as {r: {range: [0, 20]}}. The type "identity" leaves a
// color, radius or opacity as it is. The other options of the plane can't name
// a scale. Like Plot's, a chart draws the axes of its positions, at the bottom and the left: the
// options of a position also take axis, "top", "both" or null for x, "right", "both" or null for y,
// and the options of cm.axis, such as {x: {axis: "top", grid: true}}; a scale such as fill takes
// legend: true to draw its legend, and the options of cm.legend. An axis or legend added to the
// chart explicitly replaces the one of its kind drawn for the same scale, such as cm.axisY with
// anchor "right" for a second scale of y.
// In a nested flow, such as one chart per row of a parent mark, each context is drawn in the frame
// of its parent row: the cell of a band, or a width × height box around a point. The resolved
// scales are kept in context.scales, and the chart area in context.frame. With clip, the marks are
// clipped to the frame, like Plot's clip, such as bars sliding in from outside it, unless a mark
// gives its own clip option, false to draw outside it or true to be clipped without the plane's
// clip; axes aren't. A chart nested in a chart draws no axes unless asked, such as x: {axis: "bottom"}.
export function plane(
  flow,
  data,
  {
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
    // The other options are the options of scales, by name, such as x, fill or length.
    ...options
  } = {},
) {
  if (!data) throw new Error("No channels: call flow.transform(cm.encode, channels) before cm.plane.");
  const renderer = flow.renderer();
  if (!renderer) throw new Error("No renderer: call flow.renderer(renderer) before cm.plane.");
  const nested = isNested(flow);
  data = data.map((context) =>
    withScaleOptions(withSeries(context), options, [
      [keysX, "x"],
      [keysY, "y"],
    ]),
  );

  // The margins leave room for the axes of the positions encoded in any context, such as a layer
  // of branches. A position counts if it's encoded, or if a channel shares its scale, such as
  // {value: "v2", scale: "y"}. A nested chart has no margins by default: its parent's margins and
  // bands leave the room. The size and direction of y come from the first context with y.
  const has = ({value, hints = {}}, keys, name) => hasAny(value, keysOf(value, hints, keys, name));
  const hasY = data.some((context) => has(context, keysY, "y"));
  const {value: first = {}, hints: firstHints = {}} = data.find((context) => has(context, keysY, "y")) ?? data[0] ?? {};
  const firstY = keysOf(first, firstHints, keysY, "y");
  // The defaults hold the components on each side, such as an axis and its title.
  const room = nested ? null : axisRoom(data, options, keysX, keysY, has);
  marginTop ??= margin ?? (nested ? 0 : room.top || (hasY ? 10 : 0));
  marginRight ??= margin ?? (nested ? 0 : room.right || 20);
  marginBottom ??= margin ?? (nested ? 0 : room.bottom || 20);
  marginLeft ??= margin ?? (nested ? 0 : room.left || 20);

  // Values grow upward, but categories in bands go down from the top, like Plot's ordinal y, unless
  // the scale is reversed. An independent y points its own way in each context.
  const reverseOf = (hints) => {
    const {reverse, band} = axisHint(hints, keysY);
    return reverse ?? !band;
  };

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
    // The height uses the same scale and domain of y as fitting.
    const hintY = axisHint(firstHints, keysY);
    const sizeY = {...hintY, ...positionOptions([hintY], options[scaleName(firstHints, keysY, "y")])};
    height ??= auto?.height ? autoHeight(first, firstY, sizeY, marginTop + marginBottom) : rendererHeight;
    renderer.resize?.(width, height);
    ({width, height} = renderer._props);
    const frame = {top: marginTop, right: width - marginRight, bottom: height - marginBottom, left: marginLeft};
    frames = data.map(() => frame);
  }

  // The scales shared by the contexts: colors, and positions unless they're independent. A position
  // is shared with the contexts whose positions use the same scale: the axis, by default, or a name
  // given to it, such as x: {value: "culmen_length_mm", scale: "length"}. The options of scales and
  // resolve take any name, such as {x: "independent"}.
  const colors = channelScales(merge(data, scaledKeys), channelHints(data));
  const independent = (name) => resolution[name] === "independent";
  const sharedOf = (keys, axis) =>
    new Map(
      Array.from(byScaleName(data, keys, axis), ([name, contexts]) => {
        if (independent(name)) return [name, null];
        const hints = contexts.map(({hints = {}}) => axisHint(hints, keys));
        return [
          name,
          sharedScale(contexts, allKeysOf(contexts, keys, axis), keys, positionOptions(hints, options[name])),
        ];
      }),
    );
  const sharedX = sharedOf(keysX, "x");
  const sharedY = sharedOf(keysY, "y");
  // The direction of a shared y comes from the first of its contexts with y.
  const firstHintsY = new Map(
    Array.from(byScaleName(data, keysY, "y"), ([name, contexts]) => [
      name,
      (contexts.find((context) => has(context, keysY, "y")) ?? contexts[0]).hints ?? {},
    ]),
  );

  // The guides of the contexts are drawn once per scale, for all of them: the id tells them apart
  // from the guides of other charts.
  const id = {};
  return data.map((context, j) => {
    const {value, hints = {}} = context;
    // The channels of this context's scales: its positions, and the channels that join them here.
    const ownKeysX = keysOf(value, hints, keysX, "x");
    const ownKeysY = keysOf(value, hints, keysY, "y");
    const frame = frames[j];
    const rangeX = [frame.left, frame.right];
    const rangeY = [frame.top, frame.bottom];
    const nameX = scaleName(hints, keysX, "x");
    const nameY = scaleName(hints, keysY, "y");
    const hintX = axisHint(hints, keysX);
    const hintY = axisHint(hints, keysY);
    if (hintX.reverse) rangeX.reverse();
    if (reverseOf(independent(nameY) ? hints : firstHintsY.get(nameY))) rangeY.reverse();

    // An independent position is inferred from its own context, with the options of its scale.
    const x =
      sharedX.get(nameX) || positionScale(value, ownKeysX, {...hintX, ...positionOptions([hintX], options[nameX])});
    const y =
      sharedY.get(nameY) || positionScale(value, ownKeysY, {...hintY, ...positionOptions([hintY], options[nameY])});

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
    // The frame is kept as a clip shape, so that a mark can opt in with its own clip option; the
    // clip option is the default of the marks.
    const {left, top, right, bottom} = frame;
    const shape = {x: left, y: top, width: right - left, height: bottom - top};
    // The guides of the context, which its axes and legends draw: like Plot's, a chart has axes at
    // the bottom and the left by default, and a chart nested in a chart none unless asked.
    const guides = guidesOf(
      id,
      options,
      nameX,
      nameY,
      sidesOfPlane,
      nested ? {x: [], y: []} : {x: ["bottom"], y: ["left"]},
    );
    return {...withoutHints(scaled), value: newValue, scales, frame, clip: shape, clipped: clip, guides};
  });
}

// The axes and legends that a chart draws, from the guides of its contexts, before the shapes
// added to it; one of the same kind added explicitly replaces them.
plane.marks = (values) => guideMarks(values, {axisX, axisY, legend});
