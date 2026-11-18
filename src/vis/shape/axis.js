import {link} from "../../core/shape/link.js";
import {text} from "../../core/shape/text.js";
import {polarAxisX, polarAxisY} from "./axisPolar.js";
import {
  axisOptions,
  countOf,
  font,
  formatOf,
  key,
  labelOf,
  positionOf,
  reachOf,
  scaleOf,
  ticksOf,
  titleGap,
} from "./axisUtils.js";

// The size across an x axis of a label of width w and height h, rotated: its height when level.
const acrossX = (w, h, r) => Math.abs(w * Math.sin(r)) + h * Math.abs(Math.cos(r));

// The size across a y axis of a label of width w and height h, rotated: its width when level.
const acrossY = (w, h, r) => Math.abs(w * Math.cos(r)) + h * Math.abs(Math.sin(r));

// The tick labels of an x axis, rotated by tickRotate degrees like Plot's bottom axis: below 10°,
// they turn around their center; from 10° on, they end at their tick if turned counterclockwise and
// start there if turned clockwise, centered on it, with 4·cos θ more padding so that the centered
// line clears the axis. A top axis mirrors this. Returns the text options and the extra padding.
function rotatedX(degrees, top) {
  const radians = (degrees * Math.PI) / 180;
  if (Math.abs(degrees) < 10) {
    return [{textAlign: "center", textBaseline: top ? "bottom" : "top", ...(degrees && {rotate: radians})}, 0];
  }
  const end = top ? degrees > 0 : degrees < 0;
  return [{textAlign: end ? "end" : "start", textBaseline: "middle", rotate: radians}, 4 * Math.cos(radians)];
}

// The tick labels of a y axis, rotated by tickRotate degrees like Plot's left axis: steeper than
// 60°, they're centered on their tick, left of the axis, such as -90 reading bottom to top, with
// 4·cos θ more padding. A right axis mirrors this. Returns the text options and the extra padding.
function rotatedY(degrees, right) {
  const radians = (degrees * Math.PI) / 180;
  if (Math.abs(degrees) <= 60) {
    return [{textAlign: right ? "start" : "end", textBaseline: "middle", ...(degrees && {rotate: radians})}, 0];
  }
  const textBaseline = degrees < 0 === !right ? "bottom" : "top";
  return [{textAlign: "center", textBaseline, rotate: radians}, 4 * Math.cos(radians)];
}

function extentOf(range) {
  return [Math.min(...range), Math.max(...range)];
}

// Draws the x axis of the scales recorded by cm.plane, at the bottom of the chart, like Plot, or at
// the top with anchor "top"; or the angle axis of cm.polar. Its options default to the guides of the
// plane, such as {x: {axis: "top", grid: true}}; cm.plane draws it implicitly, and an axis added
// explicitly over the same contexts replaces the implicit one.
export function axisX(flow, value, {scales = {}, frame, titles, guides, options = {}} = {}) {
  options = axisOptions(flow, guides, "x", options, [axis, axisX]);
  if (!options) return;
  const {x, y} = scales;
  if (!x || frame?.empty) return; // like Plot, a facet without rows has no axes
  if (frame?.type === "polar") return polarAxisX(flow, frame, x, options, titles);
  const {tickSize = 6, tickPadding = 3, tickRotate = 0, grid = false, anchor = "bottom"} = options;
  const {height} = flow.renderer()._props;
  const scale = scaleOf(x);
  const [left, right] = extentOf(x.range);
  const [top, bottom] = frame ? [frame.top, frame.bottom] : y ? extentOf(y.range) : [0, height];
  const count = countOf(options, right - left, 80);
  const ticks = ticksOf(scale, options, count);
  const X = positionOf(scale);
  const stroke = "currentColor";
  if (grid) flow.data(ticks).append(link, {key, x: X, x1: X, y: top, y1: bottom, stroke, strokeOpacity: 0.1});
  // In facets, only the cells along the anchor label x; nested charts leave titles to the outer chart.
  if (frame?.edges && !frame.edges[anchor]) return;
  const isTop = anchor === "top";
  const [edge, k] = isTop ? [top, -1] : [bottom, 1];
  flow.data(ticks).append(link, {key, x: X, x1: X, y: edge, y1: edge + k * tickSize, stroke});
  const [rotateX, padX] = rotatedX(tickRotate, isTop);
  const format = formatOf(scale, options, count);
  flow.data(ticks).append(text, {
    key,
    ...font,
    text: format,
    x: X,
    y: edge + k * (tickSize + tickPadding + padX),
    ...rotateX,
  });
  const label = labelOf(x, scale, "x", options);
  if (label == null || frame?.nested) return;
  // The title is part of the axis: past the farthest of what it draws, its tick labels, else its
  // tick marks, else the plot, by a constant gap, under a bottom axis or over a top one. Like Plot's,
  // it's at the right end of the axis by default, with its arrow, or at the middle of a discrete
  // axis; with labelAnchor, it's at its left or right end, or its middle. The default margins of
  // cm.plane leave room for it on the sides with axes, with level tick labels; rotated tick labels,
  // an axis added explicitly on another side, or one drawn by a nested chart need a margin given to
  // it, such as marginBottom: 150 with tickRotate: -45.
  const reach = reachOf(ticks.map(format), {
    tickSize,
    tickPadding,
    radians: (tickRotate * Math.PI) / 180,
    pad: padX,
    across: acrossX,
  });
  const {labelAnchor = scale.ticks ? "right" : "center"} = options;
  const center = labelAnchor === "center";
  flow.datum(label).append(text, {
    ...font,
    text: label,
    x: center ? (left + right) / 2 : labelAnchor === "left" ? left : right,
    y: edge + k * (reach + titleGap),
    textAlign: center ? "center" : labelAnchor === "left" ? "start" : "end",
    textBaseline: isTop ? "bottom" : "top",
  });
}

// Draws the y axis of the scales recorded by cm.plane, on the left of the chart, like Plot, or on
// the right with anchor "right"; or the radius axis of cm.polar. Like cm.axisX, its options default
// to the guides of the plane, and an axis added explicitly replaces the implicit one.
export function axisY(flow, value, {scales = {}, frame, titles, guides, options = {}} = {}) {
  options = axisOptions(flow, guides, "y", options, [axis, axisY]);
  if (!options) return;
  const {x, y} = scales;
  if (!y || frame?.empty) return;
  if (frame?.type === "polar") return polarAxisY(flow, frame, y, options, titles);
  const {tickSize = 6, tickPadding = 3, tickRotate = 0, grid = false, anchor = "left"} = options;
  const {width} = flow.renderer()._props;
  const scale = scaleOf(y);
  const [left, right] = frame ? [frame.left, frame.right] : x ? extentOf(x.range) : [0, width];
  const [top, bottom] = extentOf(y.range);
  const count = countOf(options, bottom - top, 35);
  const ticks = ticksOf(scale, options, count);
  const Y = positionOf(scale);
  const stroke = "currentColor";
  if (grid) flow.data(ticks).append(link, {key, x: left, x1: right, y: Y, y1: Y, stroke, strokeOpacity: 0.1});
  // In facets, only the cells along the anchor label y; nested charts leave titles to the outer chart.
  if (frame?.edges && !frame.edges[anchor]) return;
  const isRight = anchor === "right";
  const [edge, k] = isRight ? [right, 1] : [left, -1];
  flow.data(ticks).append(link, {key, x: edge, x1: edge + k * tickSize, y: Y, y1: Y, stroke});
  const [rotateY, padY] = rotatedY(tickRotate, isRight);
  const format = formatOf(scale, options, count);
  flow.data(ticks).append(text, {
    key,
    ...font,
    text: format,
    x: edge + k * (tickSize + tickPadding + padY),
    y: Y,
    ...rotateY,
  });
  // The title is part of the axis, a constant gap past what it draws. Like Plot's labelAnchor, it's
  // level at the top of the axis, the default of a continuous scale, or at its bottom, starting at
  // the far end of its tick labels on a left axis, or ending there on a right one, with an arrow
  // along the axis; or turned to read along it at its middle, the default of a discrete scale, past
  // its tick labels, else its tick marks, else the plot. The default margins of cm.plane leave room
  // for it on the sides with axes.
  const {labelAnchor = scale.ticks ? "top" : "center"} = options;
  const turn = labelAnchor === "center";
  const label = labelOf(y, scale, "y", options, turn);
  if (label == null || frame?.nested) return;
  const reach = reachOf(ticks.map(format), {
    tickSize,
    tickPadding,
    radians: (tickRotate * Math.PI) / 180,
    pad: padY,
    across: acrossY,
  });
  if (!turn) {
    // Over the top or under the bottom of the axis, past the half of a tick label that may reach
    // past it, or past the tick labels of an axis of x on that side, in the row of its title.
    const isBottom = labelAnchor === "bottom";
    const past = guides?.x.anchors.includes(isBottom ? "bottom" : "top") ? 6 + 3 + font.fontSize : font.fontSize / 2;
    flow.datum(label).append(text, {
      ...font,
      text: label,
      x: edge + k * reach,
      y: isBottom ? bottom + past + titleGap : top - past - titleGap,
      textAlign: isRight ? "end" : "start",
      textBaseline: isBottom ? "top" : "bottom",
    });
    return;
  }
  flow.datum(label).append(text, {
    ...font,
    text: label,
    x: edge + k * (reach + titleGap),
    y: (top + bottom) / 2,
    rotate: -Math.PI / 2,
    textAlign: "center",
    // Turned a quarter counterclockwise, the text sits left of its point, or right of it.
    textBaseline: isRight ? "top" : "bottom",
  });
}

// Draws both axes. The options x and y are the options of each axis, or false to skip it; the
// other options apply to both.
export function axis(flow, value, {options = {}, ...context} = {}) {
  const {x = {}, y = {}, ...shared} = options;
  if (x !== false) axisX(flow, value, {...context, options: {...shared, ...x}});
  if (y !== false) axisY(flow, value, {...context, options: {...shared, ...y}});
}

// Axes receive their options as they are, such as a tickFormat function, not per datum.
axis.raw = axisX.raw = axisY.raw = true;
