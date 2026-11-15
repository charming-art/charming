import {link} from "../../core/shape/link.js";
import {text} from "../../core/shape/text.js";
import {polarAxisX, polarAxisY} from "./axisPolar.js";
import {font, formatOf, positionOf, scaleOf, ticksOf} from "./axisUtils.js";

// The count of ticks: the ticks option if it's a number, or one tick per spacing pixels, like Plot.
function countOf({ticks}, [start, end], spacing) {
  return typeof ticks === "number" ? ticks : (end - start) / spacing;
}

// Like Plot, the label of a continuous scale has an arrow for the direction of increasing values,
// unless the label is given explicitly or already has one.
function labelOf({label, domain, range}, scale, axis, options) {
  if (options.label !== undefined) return options.label;
  if (label == null) return null;
  if (!scale.ticks || /[↑↓→←]/.test(label)) return `${label}`;
  const order = Math.sign(domain[domain.length - 1] - domain[0]) * Math.sign(range[range.length - 1] - range[0]);
  if (!order) return `${label}`;
  if (axis === "x") return order > 0 ? `${label} →` : `← ${label}`;
  return order < 0 ? `↑ ${label}` : `↓ ${label}`;
}

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
// the top with anchor "top"; or the angle axis of cm.polar.
export function axisX(flow, value, {scales = {}, frame, options = {}} = {}) {
  const {x, y} = scales;
  if (!x || frame?.empty) return; // like Plot, a facet without rows has no axes
  if (frame?.type === "polar") return polarAxisX(flow, frame, x, options);
  const {tickSize = 6, tickPadding = 3, tickRotate = 0, grid = false, anchor = "bottom"} = options;
  const {width, height} = flow.renderer()._props;
  const scale = scaleOf(x);
  const [left, right] = extentOf(x.range);
  const [top, bottom] = frame ? [frame.top, frame.bottom] : y ? extentOf(y.range) : [0, height];
  const count = countOf(options, [left, right], 80);
  const ticks = ticksOf(scale, options, count);
  const X = positionOf(scale);
  const stroke = "currentColor";
  if (grid) flow.data(ticks).append(link, {x: X, x1: X, y: top, y1: bottom, stroke, strokeOpacity: 0.1});
  // In facets, only the cells along the anchor label x; nested charts leave titles to the outer chart.
  if (frame?.edges && !frame.edges[anchor]) return;
  const isTop = anchor === "top";
  const [edge, k] = isTop ? [top, -1] : [bottom, 1];
  flow.data(ticks).append(link, {x: X, x1: X, y: edge, y1: edge + k * tickSize, stroke});
  const [rotateX, padX] = rotatedX(tickRotate, isTop);
  flow.data(ticks).append(text, {
    ...font,
    text: formatOf(scale, options, count),
    x: X,
    y: edge + k * (tickSize + tickPadding + padX),
    ...rotateX,
  });
  const label = labelOf(x, scale, "x", options);
  if (label == null || frame?.nested) return;
  const center = !scale.ticks;
  flow.datum(label).append(text, {
    ...font,
    text: label,
    x: center ? (left + right) / 2 : width - 3,
    // 3px from the edge of the chart, on the far side of the tick labels: a top axis's labels
    // hang below their baseline, so its title is 3px higher.
    y: isTop ? 0 : height - 3,
    textAlign: center ? "center" : "end",
    ...(isTop && {textBaseline: "top"}),
  });
}

// Draws the y axis of the scales recorded by cm.plane, on the left of the chart, like Plot, or on
// the right with anchor "right"; or the radius axis of cm.polar.
export function axisY(flow, value, {scales = {}, frame, options = {}} = {}) {
  const {x, y} = scales;
  if (!y || frame?.empty) return;
  if (frame?.type === "polar") return polarAxisY(flow, frame, y, options);
  const {tickSize = 6, tickPadding = 3, tickRotate = 0, grid = false, anchor = "left"} = options;
  const {width} = flow.renderer()._props;
  const scale = scaleOf(y);
  const [left, right] = frame ? [frame.left, frame.right] : x ? extentOf(x.range) : [0, width];
  const [top, bottom] = extentOf(y.range);
  const count = countOf(options, [top, bottom], 35);
  const ticks = ticksOf(scale, options, count);
  const Y = positionOf(scale);
  const stroke = "currentColor";
  if (grid) flow.data(ticks).append(link, {x: left, x1: right, y: Y, y1: Y, stroke, strokeOpacity: 0.1});
  // In facets, only the cells along the anchor label y; nested charts leave titles to the outer chart.
  if (frame?.edges && !frame.edges[anchor]) return;
  const isRight = anchor === "right";
  const [edge, k] = isRight ? [right, 1] : [left, -1];
  flow.data(ticks).append(link, {x: edge, x1: edge + k * tickSize, y: Y, y1: Y, stroke});
  const [rotateY, padY] = rotatedY(tickRotate, isRight);
  flow.data(ticks).append(text, {
    ...font,
    text: formatOf(scale, options, count),
    x: edge + k * (tickSize + tickPadding + padY),
    y: Y,
    ...rotateY,
  });
  const label = labelOf(y, scale, "y", options);
  if (label == null || frame?.nested) return;
  const [labelX, textAlign] = isRight ? [width - 3, "end"] : [3, "start"];
  flow.datum(label).append(text, {...font, text: label, x: labelX, y: 3, textAlign, textBaseline: "top"});
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
