import {scaleRadial} from "d3-scale";
import {arc} from "d3-shape";
import {axisX, axisY, outerReach} from "../shape/axis.js";
import {polarLabelBoxes} from "../shape/axisPolar.js";
import {legend, rightLegends, topLegends} from "../shape/legend.js";
import {point, scale} from "../../core/transform/scale.js";
import {
  allKeysOf,
  axisHint,
  byScaleName,
  callable,
  channelHints,
  channelScales,
  guideMarks,
  gridFrames,
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
  stackTimes,
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
// guides, and the timings of transitions, which share one scale, time, such as {time: {range: [0,
// 3000]}}; unlike it, a polar chart draws no axes unless asked, such as {x: {axis: true}}.
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

  // The scales shared by all the contexts: colors, and positions unless they're independent,
  // resolved before the frame, as they don't depend on it, so that what the axes and legends draw
  // can be measured for the margins. Like cm.plane, a position is shared by the name of its scale,
  // the axis by default.
  const colors = channelScales(merge(data, scaledKeys), channelHints(data));
  const independent = (name) => resolution[name] === "independent";
  // The type and domain of a position: the options of its scale, unless it has bands, else its
  // hint; the radius is radial by default, so that areas grow with values.
  const positionOf = (hints, keys, name, fallback) => {
    const {type, ...own} = positionOptions(hints, options[name]);
    return {...own, type: radial(type ?? hints[0]?.type ?? fallback)};
  };
  const sharedOf = (keys, axis, fallback) =>
    new Map(
      Array.from(byScaleName(data, keys, axis), ([name, contexts]) => {
        if (independent(name)) return [name, null];
        const all = allKeysOf(contexts, keys, axis);
        const hints = contexts.map(({hints = {}}) => axisHint(hints, keys));
        return [name, sharedScale(contexts, all, keys, positionOf(hints, keys, name, fallback))];
      }),
    );
  const sharedX = sharedOf(keysX, "x");
  const sharedY = sharedOf(keysY, "y", "radial");

  // The angles of a context, recorded for its axis: they don't depend on the frame.
  const angleRecordOf = ({value, hints = {}}) => {
    const hintX = axisHint(hints, keysX);
    const nameX = scaleName(hints, keysX, "x");
    const rangeX = hintX.reverse ? [endAngle, startAngle] : [startAngle, endAngle];
    const ownX = positionOf([hintX], keysX, nameX);
    const ownKeysX = keysOf(value, hints, keysX, "x");
    const x = sharedX.get(nameX) || positionScale(value, ownKeysX, {...ownX, domain: ownX.domain ?? hintX.domain});
    return {nameX, recordX: callable(labeled(positionRecord(x, rangeX, hintX), hintX), options[nameX])};
  };

  // The polar frame of a box inside margins: a disc, or a ring, centered in it.
  const frameOf = ({left, right, top, bottom, nested}, {top: mt, right: mr, bottom: mb, left: ml}) => {
    const l = left + ml;
    const r = right - mr;
    const t = top + mt;
    const b = bottom - mb;
    const outerRadius = Math.max(0, Math.min(r - l, b - t) / 2);
    const r0 = innerRadius * outerRadius;
    // The left of the box inside the margins is kept for the legends at the top, which start there.
    const frame = {type: "polar", cx: (l + r) / 2, cy: (t + b) / 2, innerRadius: r0, outerRadius, startAngle, endAngle};
    frame.left = l;
    // Like cm.plane's, a nested frame is marked, so that its axes leave titles to the outer chart.
    return nested ? {...frame, nested} : frame;
  };

  let frames, legendX, legendAt;
  if (nested) {
    // A nested chart has no margins by default: its parent leaves the room. In a grid of cells,
    // such as facets, its legends are drawn once for the grid, with room kept for them at its
    // edges, as gridFrames lays out.
    const margins = {top: marginTop, right: marginRight, bottom: marginBottom, left: marginLeft};
    for (const side in margins) margins[side] ??= margin ?? 0;
    const {width: rendererWidth} = renderer._props;
    const legends = (left, height) => ({
      top: topLegends(data, colors, options, rendererWidth - 3 - left),
      right: rightLegends(data, colors, options, height),
    });
    const grid = gridFrames(nestedFrames(flow, data, {width, height}), {
      legends,
      outer: outerReach,
      shared: typeof flow._data !== "function",
    });
    frames = grid.frames.map((box) => frameOf(box, margins));
    legendAt = grid.legendAt;
  } else {
    // The margins that aren't given are 40, like the default margin, and grow to fit what's drawn
    // past the disc: the tick labels of an angle axis on the outer ring, and the legends on the
    // right, 3px from the edges of the chart, and the legends at the top, over the margin unless
    // marginTop is given. As the disc shrinks and moves with the margins, each growth takes in about
    // half of what's past the edge, so they grow until it's under a thousandth of a pixel, up to 30
    // times; a given margin, or margin for every side, stays as it is.
    const {auto, width: rendererWidth, height: rendererHeight} = renderer._props;
    width ??= auto?.width ? 640 : rendererWidth;
    height ??= auto?.height ? 640 : rendererHeight;
    renderer.resize?.(width, height);
    ({width, height} = renderer._props);
    const box = {left: 0, right: width, top: 0, bottom: height};
    const given = {top: marginTop, right: marginRight, bottom: marginBottom, left: marginLeft};
    const base = {};
    for (const side in given) base[side] = given[side] ?? margin ?? 40;
    // The legends at the top start at the left margin, so they're measured again as it grows.
    const legendsAt = (left) => (given.top === undefined ? topLegends(data, colors, options, width - 3 - left) : 0);
    let legendRoom = legendsAt(base.left);
    const margins = {...base, top: base.top + legendRoom};
    // The titles of the axes asked, given by labels, sit in the corners, the angle's at the bottom
    // and the radius's at the top, so the outer labels keep clear of their rows.
    const titled = {x: false, y: false};
    for (const {hints = {}} of data) {
      const nameX = scaleName(hints, keysX, "x");
      const nameY = scaleName(hints, keysY, "y");
      const {x, y} = guidesOf(null, options, nameX, nameY, sidesOfPolar, {x: [], y: []});
      if (x.anchors.length && options[nameX]?.label != null) titled.x = true;
      if (y.anchors.length && options[nameY]?.label != null) titled.y = true;
    }
    // What's drawn past the disc for margins: the tick labels of the outer angle axes, and the
    // legends on the right, like cm.plane's, past those labels, or right of a given margin, which
    // they add to, ending 3px from the right of the chart.
    const layoutAt = (margins) => {
      const frame = frameOf(box, margins);
      const boxes = [];
      for (const context of data) {
        if (!hasAny(context.value, keysOf(context.value, context.hints ?? {}, keysX, "x"))) continue;
        const {nameX, recordX} = angleRecordOf(context);
        const {x: guide} = guidesOf(null, options, nameX, "y", sidesOfPolar, {x: [], y: []});
        const {anchors, ...axis} = guide;
        for (const anchor of anchors) boxes.push(...polarLabelBoxes(frame, recordX, {...axis, anchor}));
      }
      const legendWidth = rightLegends(data, colors, options, 2 * frame.outerRadius);
      const reach = Math.max(0, ...boxes.map(([, , x1]) => x1 - (frame.cx + frame.outerRadius)));
      const legendX =
        margin !== undefined && given.right === undefined
          ? width - 3 - legendWidth
          : frame.cx + frame.outerRadius + reach + 12;
      return {boxes, legendWidth, legendX};
    };
    for (let pass = 0; pass < 30; pass++) {
      const layout = layoutAt(margins);
      const {boxes, legendWidth} = layout;
      legendX = layout.legendX;
      let grown = false;
      const grow = (side, over) => {
        if (given[side] === undefined && over > 1e-3) [margins[side], grown] = [margins[side] + over, true];
      };
      if (margin === undefined) {
        const top = legendRoom + 3 + (titled.y ? 10 + 6 : 0);
        const bottom = height - 3 - (titled.x ? 10 + 6 : 0);
        grow("left", Math.max(0, ...boxes.map(([x0]) => 3 - x0)));
        grow("top", Math.max(0, ...boxes.map(([, y0]) => top - y0)));
        grow("bottom", Math.max(0, ...boxes.map(([, , , y1]) => y1 - bottom)));
        const right = Math.max(...boxes.map(([, , x1]) => x1), legendWidth ? legendX + legendWidth : -Infinity);
        grow("right", right - (width - 3));
      } else if (given.right === undefined) {
        // A given margin holds the disc and its labels; the legends on the right add to it.
        const next = margin + (legendWidth ? 12 + legendWidth + 3 : 0);
        if (next !== margins.right) [margins.right, grown] = [next, true];
      }
      // As the left margin grows, the legends at the top may wrap into more rows.
      const room = legendsAt(margins.left);
      if (room !== legendRoom) [margins.top, legendRoom, grown] = [margins.top + room - legendRoom, room, true];
      if (!grown) break;
    }
    legendX = layoutAt(margins).legendX;
    frames = data.map(() => frameOf(box, margins));
  }

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

    const [scaledColors] = scale(flow, [context], scaleDescriptors(colors));
    // The rows arranged by cm.stackEnter are timed once their delays and durations are scaled.
    const colored = {...scaledColors, value: stackTimes(scaledColors.value, hints)};
    const descriptors = {};
    for (const key of ownKeysX)
      if (key in value) descriptors[key] = {scale: x.type, domain: x.domain, range: rangeX, clamp: x.clamp};
    for (const key of ownKeysY)
      if (key in value) descriptors[key] = {scale: y.type, domain: y.domain, range: rangeY, clamp: y.clamp};
    const [scaled] = scale(flow, [colored], descriptors, point);

    const scales = {...context.scales};
    for (const key in colors) scales[key] = labeled(resolve(colors[key]), hints[key]);
    const recordX = callable(labeled(positionRecord(x, rangeX, hintX), hintX), options[nameX]);
    const recordY = callable(labeled(positionRecord(y, rangeY, hintY), hintY), options[nameY]);
    // The scale is recorded as x or y, for axes, even if only channels that share it are encoded.
    if (hasAny(value, ownKeysX)) scales[keysX[0]] = recordX;
    if (hasAny(value, ownKeysY)) scales[keysY[0]] = recordY;
    for (const key of ownKeysX) if (key in value) scales[key] = recordX;
    for (const key of ownKeysY) if (key in value) scales[key] = recordY;

    // A missing position fills its span: a pie has no y, so its wedges span the whole radius. Like a
    // stack, y is the outer radius and y1 the baseline.
    const newValue = {...scaled.value};
    const n = Object.values(value)[0]?.length ?? 0; // all channels have one value per row
    // What's added to draw, rather than encoded, so that a string of a shape names a field, not it.
    const derived = [...(context.derived ?? []), "cx", "cy"];
    // A missing position spans the frame whichever way its scale goes.
    if (!hasAny(value, ownKeysY)) {
      [newValue[keysY[1]], newValue[keysY[0]]] = span(n, [r0, outerRadius]); // y outer, y1 inner
      derived.push(keysY[0], keysY[1]);
    }
    if (!hasAny(value, ownKeysX)) {
      [newValue[keysX[0]], newValue[keysX[1]]] = span(n, [startAngle, endAngle]);
      derived.push(keysX[0], keysX[1]);
    }
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
    if (legendX !== undefined) guides.legendX = legendX;
    if (j === legendAt?.index) guides.legendAt = legendAt;
    return {
      ...withoutHints(scaled),
      value: newValue,
      scales,
      frame,
      titles,
      clip: shape,
      clipped: clip,
      guides,
      derived,
    };
  });
}

// The axes and legends that a polar chart draws, when asked, before the shapes added to it.
polar.marks = (values) => guideMarks(values, {axisX, axisY, legend});
