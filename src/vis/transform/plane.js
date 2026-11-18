import {InternSet} from "d3-array";
import {discrete, point, scale} from "../../core/transform/scale.js";
import {axisX, axisY, extentX, extentY} from "../shape/axis.js";
import {labelOf, widthOf} from "../shape/axisUtils.js";
import {legend, rightLegends, topLegends} from "../shape/legend.js";
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
  scaleOf,
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

// What a chart draws past its plot on each side, for its margins, given the records of the
// positions of each context: its axes, as cm.axisX and cm.axisY draw them, on the sides of their
// guides, and their titles, on the first side of each axis. Past an axis of x is its title, 6 + 10;
// beside an axis of y, its title turned, 6 + 10, or level, in a row over or under the plot, of half
// a label, else the tick labels of an axis of x on that side, 6 and 10, shared with its title. The
// tick labels at the ends of an axis may also reach past the plot along it, such as half the last
// label of x past its right. Under a legend at the top, the title of y at the top is turned.
function measureSides(data, options, keysX, keysY, has, recordsOf, colors) {
  const reach = {top: 0, right: 0, bottom: 0, left: 0};
  const over = {top: 0, right: 0, bottom: 0, left: 0};
  const rows = {top: false, bottom: false};
  const level = {top: false, bottom: false};
  // A legend at the top is drawn for a scale resolved, as the axes tell, not a color as it is.
  const topLegend = scaledKeys.some((key) => options[key]?.legend && options[key].legend !== "right" && colors[key]);
  for (const context of data) {
    const hasX = has(context, keysX, "x");
    const hasY = has(context, keysY, "y");
    if (!hasX && !hasY) continue;
    const {nameX, nameY, recordX, recordY} = recordsOf(context);
    const {x, y} = guidesOf(null, options, nameX, nameY, sidesOfPlane, {x: ["bottom"], y: ["left"]});
    if (hasX) {
      x.anchors.forEach((side, i) => {
        const {reach: r, start, end} = extentX(recordX, x, side);
        reach[side] = Math.max(reach[side], r);
        over.left = Math.max(over.left, start);
        over.right = Math.max(over.right, end);
        if (i === 0 && recordX.label != null) rows[side] = true;
      });
      // A title longer than its axis reaches past its ends: from the middle, both ways, or from an
      // end, past the other one.
      const scale = scaleOf(recordX);
      const title = x.anchors.length ? labelOf(recordX, scale, "x", x) : null;
      if (title != null) {
        const [left, right] = [Math.min(...recordX.range), Math.max(...recordX.range)];
        const past = widthOf(title) - (right - left);
        const labelAnchor = x.labelAnchor ?? (scale.ticks ? "right" : "center");
        const [before, after] =
          labelAnchor === "center" ? [past / 2, past / 2] : labelAnchor === "right" ? [past, 0] : [0, past];
        over.left = Math.max(over.left, before);
        over.right = Math.max(over.right, after);
      }
    }
    if (hasY) {
      const labelAnchor = y.labelAnchor ?? (scaleOf(recordY).ticks ? "top" : "center");
      const turned = labelAnchor === "center" || (labelAnchor === "top" && topLegend);
      y.anchors.forEach((side, i) => {
        const {reach: r, start, end} = extentY(recordY, y, side);
        const titled = i === 0 && recordY.label != null;
        reach[side] = Math.max(reach[side], r + (titled && turned ? 6 + 10 : 0));
        over.top = Math.max(over.top, start);
        over.bottom = Math.max(over.bottom, end);
        if (titled && !turned) level[labelAnchor] = true;
      });
      // A turned title longer than its axis reaches past its ends: from the middle, both ways, or
      // from the top, under the bottom.
      const title = y.anchors.length && turned ? labelOf(recordY, scaleOf(recordY), "y", y, true) : null;
      if (title != null) {
        const [top, bottom] = [Math.min(...recordY.range), Math.max(...recordY.range)];
        const past = widthOf(title) - (bottom - top);
        const [above, below] = labelAnchor === "center" ? [past / 2, past / 2] : [0, past];
        over.top = Math.max(over.top, above);
        over.bottom = Math.max(over.bottom, below);
      }
    }
  }
  // At the top or the bottom, an axis of x and a level title of y share a row of titles, past the
  // tick labels of x, or half a label without them.
  // On the right, the legends start past the farther of the axes and the ends of the labels of x.
  const extent = {left: Math.max(reach.left, over.left), right: Math.max(reach.right, over.right)};
  for (const side of ["top", "bottom"]) {
    const row = rows[side] || level[side] ? 6 + 10 : 0;
    const past = reach[side] || (level[side] ? 5 : 0);
    extent[side] = Math.max(over[side], past + row);
  }
  return extent;
}

// What the axes asked of a chart nested in a grid of cells, such as facets, draw past each cell,
// given the records of the positions of each context in its cell: how far they reach across each
// side, and how far their tick labels reach past the ends, as cm.axisX and cm.axisY draw them, on
// any cell with rows. Nested charts draw no titles.
function measureCells(data, options, keysX, keysY, has, recordsOf, frames) {
  const room = {top: 0, right: 0, bottom: 0, left: 0};
  data.forEach((context, j) => {
    if (!frames[j].edges || frames[j].empty) return;
    const hasX = has(context, keysX, "x");
    const hasY = has(context, keysY, "y");
    if (!hasX && !hasY) return;
    const {nameX, nameY, recordX, recordY} = recordsOf(context, j);
    const {x, y} = guidesOf(null, options, nameX, nameY, sidesOfPlane, {x: [], y: []});
    if (hasX) {
      for (const side of x.anchors) {
        const {reach, start, end} = extentX(recordX, x, side);
        room[side] = Math.max(room[side], reach);
        room.left = Math.max(room.left, start);
        room.right = Math.max(room.right, end);
      }
    }
    if (hasY) {
      for (const side of y.anchors) {
        const {reach, start, end} = extentY(recordY, y, side);
        room[side] = Math.max(room[side], reach);
        room.top = Math.max(room.top, start);
        room.bottom = Math.max(room.bottom, end);
      }
    }
  });
  return room;
}

// The sides of the axes of a plane: the first is the side of axis true, and both are "both".
const sidesOfPlane = {
  x: {first: "bottom", both: ["bottom", "top"]},
  y: {first: "left", both: ["left", "right"]},
};

// Resolves the scales of the channels, and maps positions to the chart area with y up, inside margins
// that fit what the chart draws on each side, its axes, their titles and its legends, unless given. A renderer without a given size is resized, like Plot: 640 wide, with
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

  // The size and direction of y come from the first context with y. A position counts if it's
  // encoded, or if a channel shares its scale, such as {value: "v2", scale: "y"}.
  const has = ({value, hints = {}}, keys, name) => hasAny(value, keysOf(value, hints, keys, name));
  const hasY = data.some((context) => has(context, keysY, "y"));
  const {value: first = {}, hints: firstHints = {}} = data.find((context) => has(context, keysY, "y")) ?? data[0] ?? {};
  const firstY = keysOf(first, firstHints, keysY, "y");

  // The colors, radii and opacities shared by the contexts, and positions unless they're
  // independent, resolved before the frame, as they don't depend on it, so that what the axes and
  // legends draw can be measured for the margins. A position is shared with the contexts whose
  // positions use the same scale: the axis, by default, or a name given to it, such as x: {value:
  // "culmen_length_mm", scale: "length"}. The options of scales and resolve take any name, such as
  // {x: "independent"}.
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
  // The direction of a shared y comes from the first of its contexts with y. Values grow upward,
  // but categories in bands go down from the top, like Plot's ordinal y, unless the scale is
  // reversed. An independent y points its own way in each context.
  const firstHintsY = new Map(
    Array.from(byScaleName(data, keysY, "y"), ([name, contexts]) => [
      name,
      (contexts.find((context) => has(context, keysY, "y")) ?? contexts[0]).hints ?? {},
    ]),
  );
  const reverseOf = (hints) => {
    const {reverse, band} = axisHint(hints, keysY);
    return reverse ?? !band;
  };

  // The scales of the positions of a context in a frame, and their records, for the axes.
  const recordsOf = ({value, hints = {}}, frame) => {
    const ownKeysX = keysOf(value, hints, keysX, "x");
    const ownKeysY = keysOf(value, hints, keysY, "y");
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
    const recordX = callable(labeled(positionRecord(x, rangeX, hintX), hintX));
    const recordY = callable(labeled(positionRecord(y, rangeY, hintY), hintY));
    return {x, y, rangeX, rangeY, nameX, nameY, ownKeysX, ownKeysY, recordX, recordY};
  };

  let frames, legendX;
  if (nested) {
    // A nested chart has no margins of its own by default: its parent's margins and bands leave the
    // room. In a grid of cells, such as facets, the axes asked of it, such as x: {axis: "bottom"},
    // fit inside the cells: every cell is inset by what they draw on each side, measured as the axes
    // draw them on the cells along the edges, plus 3px, so that the cells stay aligned and share
    // their scales. As the ticks depend on the size of the cells, they're measured again until they
    // hold, up to three times, the insets only growing, as fewer ticks in narrower cells may need
    // less room, such as "0" rather than "0.0", which would widen them again; a given margin stays.
    const boxes = nestedFrames(flow, data, {width, height});
    const given = {top: marginTop, right: marginRight, bottom: marginBottom, left: marginLeft};
    const inset = (margins) =>
      boxes.map((frame) => ({
        ...frame,
        top: frame.top + margins.top,
        right: frame.right - margins.right,
        bottom: frame.bottom - margins.bottom,
        left: frame.left + margins.left,
      }));
    let margins = Object.fromEntries(Object.keys(given).map((side) => [side, given[side] ?? margin ?? 0]));
    frames = inset(margins);
    if (boxes.some((frame) => frame.edges) && Object.values(given).includes(undefined) && margin === undefined) {
      for (let pass = 0; pass < 3; pass++) {
        const room = measureCells(
          data,
          options,
          keysX,
          keysY,
          has,
          (context, j) => recordsOf(context, frames[j]),
          frames,
        );
        const next = Object.fromEntries(
          Object.keys(given).map((side) => [
            side,
            given[side] ?? Math.max(margins[side], room[side] ? room[side] + 3 : 0),
          ]),
        );
        if (Object.keys(next).every((side) => next[side] === margins[side])) break;
        margins = next;
        frames = inset(margins);
      }
    }
  } else {
    // The margins that aren't given fit what's drawn on each side: the axes, their titles, the
    // ends of the tick labels past the plot, and the legends at the top and on the right, plus 3px,
    // and at least the floors of a chart without axes: 10 over y, else 0, and 20 on the other
    // sides. As the ticks of the axes depend on the size of the plot, which depends on the
    // margins, they're measured again until they hold, up to three times. The legends at the top
    // and on the right add to margin, unless marginTop or marginRight is given itself.
    const given = {top: marginTop, right: marginRight, bottom: marginBottom, left: marginLeft};
    const floors = {top: hasY ? 10 : 0, right: 20, bottom: 20, left: 20};
    const {auto, height: rendererHeight} = renderer._props;
    width ??= auto?.width ? 640 : renderer._props.width;
    const hintY = axisHint(firstHints, keysY);
    const sizeY = {...hintY, ...positionOptions([hintY], options[scaleName(firstHints, keysY, "y")])};
    let margins = Object.fromEntries(Object.keys(floors).map((side) => [side, given[side] ?? margin ?? floors[side]]));
    // The frame inside margins, with the height they give, and what's drawn past it.
    const frameAt = (margins) => {
      const frameHeight =
        height ?? (auto?.height ? autoHeight(first, firstY, sizeY, margins.top + margins.bottom) : rendererHeight);
      return {top: margins.top, right: width - margins.right, bottom: frameHeight - margins.bottom, left: margins.left};
    };
    const measure = (margins) => {
      const frame = frameAt(margins);
      return measureSides(data, options, keysX, keysY, has, (context) => recordsOf(context, frame), colors);
    };
    const fit = (side, extent) => Math.max(floors[side], extent ? extent + 3 : 0);
    let room = measure(margins);
    for (let pass = 0; pass < 3; pass++) {
      const frame = frameAt(margins);
      const legendsTop = topLegends(data, colors, options, width - 3 - margins.left);
      const legendsRight = rightLegends(data, colors, options, frame.bottom - frame.top);
      const next = {
        top: (given.top ?? margin ?? fit("top", room.top)) + (given.top === undefined ? legendsTop : 0),
        right:
          given.right ??
          (margin !== undefined
            ? margin + (legendsRight ? 12 + legendsRight + 3 : 0)
            : fit("right", room.right + (legendsRight ? 12 + legendsRight : 0))),
        bottom: given.bottom ?? margin ?? fit("bottom", room.bottom),
        left: given.left ?? margin ?? fit("left", room.left),
      };
      if (Object.keys(next).every((side) => next[side] === margins[side])) break;
      // What's drawn is measured on the margins kept, even past the last pass, for the legends.
      margins = next;
      room = measure(margins);
    }
    ({top: marginTop, right: marginRight, bottom: marginBottom, left: marginLeft} = margins);
    height ??= auto?.height ? autoHeight(first, firstY, sizeY, marginTop + marginBottom) : rendererHeight;
    renderer.resize?.(width, height);
    ({width, height} = renderer._props);
    const frame = {top: marginTop, right: width - marginRight, bottom: height - marginBottom, left: marginLeft};
    // The legends on the right start past the axes on the right of the plot, or past margin, which
    // they add to, if it's given.
    legendX = frame.right + (margin !== undefined && given.right === undefined ? margin : room.right) + 12;
    frames = data.map(() => frame);
  }

  // The guides of the contexts are drawn once per scale, for all of them: the id tells them apart
  // from the guides of other charts.
  const id = {};
  return data.map((context, j) => {
    const {value, hints = {}} = context;
    const frame = frames[j];
    const {x, y, rangeX, rangeY, nameX, nameY, ownKeysX, ownKeysY, recordX, recordY} = recordsOf(context, frame);

    // Colors are categorical by default, and positions are discrete points by default.
    const [colored] = scale(flow, [context], scaleDescriptors(colors));
    const descriptors = {};
    for (const key of ownKeysX) if (key in value) descriptors[key] = {scale: x.type, domain: x.domain, range: rangeX};
    for (const key of ownKeysY) if (key in value) descriptors[key] = {scale: y.type, domain: y.domain, range: rangeY};
    const [scaled] = scale(flow, [colored], descriptors, point);

    const scales = {...context.scales};
    for (const key in colors) scales[key] = labeled(resolve(colors[key]), hints[key]);
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
    if (legendX !== undefined) guides.legendX = legendX;
    return {...withoutHints(scaled), value: newValue, scales, frame, clip: shape, clipped: clip, guides};
  });
}

// The axes and legends that a chart draws, from the guides of its contexts, before the shapes
// added to it; one of the same kind added explicitly replaces them.
plane.marks = (values) => guideMarks(values, {axisX, axisY, legend});
