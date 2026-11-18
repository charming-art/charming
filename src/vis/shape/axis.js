import {link} from "../../core/shape/link.js";
import {text} from "../../core/shape/text.js";
import {polarAxisX, polarAxisY} from "./axisPolar.js";
import {axisOptions, countOf, font, formatOf, key, labelOf, positionOf, scaleOf, ticksOf} from "./axisUtils.js";

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
  const {width, height} = flow.renderer()._props;
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
  flow.data(ticks).append(text, {
    key,
    ...font,
    text: formatOf(scale, options, count),
    x: X,
    y: edge + k * (tickSize + tickPadding + padX),
    ...rotateX,
  });
  const label = labelOf(x, scale, "x", options);
  if (label == null || frame?.nested) return;
  // Like Plot's labelAnchor, the title is at the right of the chart, or centered over a discrete
  // axis by default, or at the left of the chart or the center of the axis: in the margins, 3px
  // from the edges.
  const {labelAnchor = scale.ticks ? "right" : "center"} = options;
  const center = labelAnchor === "center";
  flow.datum(label).append(text, {
    ...font,
    text: label,
    x: center ? (left + right) / 2 : labelAnchor === "left" ? 3 : width - 3,
    // At the edge of the chart, on the far side of the tick labels: 3px above the bottom, on its
    // baseline, or hanging 3px below the top. Like the default margins, which leave room for a
    // bottom axis, a top axis needs a margin given to cm.plane, such as marginTop: 40.
    y: isTop ? 3 : height - 3,
    textAlign: center ? "center" : labelAnchor === "left" ? "start" : "end",
    ...(isTop && {textBaseline: "top"}),
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
  const {width, height} = flow.renderer()._props;
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
  flow.data(ticks).append(text, {
    key,
    ...font,
    text: formatOf(scale, options, count),
    x: edge + k * (tickSize + tickPadding + padY),
    y: Y,
    ...rotateY,
  });
  // Like Plot's labelAnchor, the title is at the top of the chart by default, or at its bottom, in
  // the margins 3px from the edges; or at the center of the axis, turned to read along it, bottom
  // to top, on either side. A right axis needs a margin given to cm.plane, such as marginRight: 40,
  // like a top axis.
  const {labelAnchor = "top"} = options;
  const turned = labelAnchor === "center";
  const label = labelOf(y, scale, "y", options, turned);
  if (label == null || frame?.nested) return;
  const labelX = isRight ? width - 3 : 3;
  if (turned) {
    // Turned a quarter counterclockwise, the text hangs right of the left edge, or sits left of the
    // right edge.
    const textBaseline = isRight ? "bottom" : "top";
    const y = (top + bottom) / 2;
    flow
      .datum(label)
      .append(text, {...font, text: label, x: labelX, y, rotate: -Math.PI / 2, textAlign: "center", textBaseline});
    return;
  }
  const textAlign = isRight ? "end" : "start";
  const [labelY, textBaseline] = labelAnchor === "bottom" ? [height - 3, "bottom"] : [3, "top"];
  flow.datum(label).append(text, {...font, text: label, x: labelX, y: labelY, textAlign, textBaseline});
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
