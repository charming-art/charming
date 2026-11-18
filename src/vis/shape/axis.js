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
  widthOf,
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

// The box of a text w wide and h tall, anchored at (0, 0) by textAlign and textBaseline, turned by
// radians around its anchor, clockwise, as the renderers draw it: [x0, x1, y0, y1].
function boxOf(w, h, radians, textAlign, textBaseline) {
  const a = textAlign === "start" ? 0 : textAlign === "end" ? -w : -w / 2;
  const b = textBaseline === "top" ? 0 : textBaseline === "bottom" ? -h : -h / 2;
  const [cos, sin] = [Math.cos(radians), Math.sin(radians)];
  const X = [];
  const Y = [];
  for (const [x, y] of [
    [a, b],
    [a + w, b],
    [a, b + h],
    [a + w, b + h],
  ]) {
    X.push(x * cos - y * sin);
    Y.push(x * sin + y * cos);
  }
  return [Math.min(...X), Math.max(...X), Math.min(...Y), Math.max(...Y)];
}

// What an axis of x on a side draws past the plot, with the options of its axis, as cm.axisX draws
// it: how far it reaches across the axis, its tick marks and labels, and how far its tick labels
// reach past the start and the end of the axis, such as half the last label past the right of the
// plot. Its tick labels are measured like Plot's, by the widths of their characters.
export function extentX(x, options = {}, side = "bottom") {
  const {tickSize = 6, tickPadding = 3, tickRotate = 0} = options;
  const scale = scaleOf(x);
  const [left, right] = extentOf(x.range);
  const count = countOf(options, right - left, 80);
  const ticks = ticksOf(scale, options, count);
  const format = formatOf(scale, options, count);
  const labels = ticks.map(format);
  const radians = (tickRotate * Math.PI) / 180;
  const [{textAlign, textBaseline}, pad] = rotatedX(tickRotate, side === "top");
  const reach = reachOf(labels, {tickSize, tickPadding, radians, pad, across: acrossX});
  // Along the axis, a label spans its box turned around its anchor at its tick.
  const X = positionOf(scale);
  let [start, end] = [0, 0];
  ticks.forEach((d, i) => {
    const label = `${labels[i] ?? ""}`;
    if (label === "") return;
    const [x0, x1] = boxOf(widthOf(label), font.fontSize, radians, textAlign, textBaseline);
    start = Math.max(start, left - (X(d) + x0));
    end = Math.max(end, X(d) + x1 - right);
  });
  return {reach, start, end};
}

// What an axis of y on a side draws past the plot, as cm.axisY draws it: how far it reaches across
// the axis, and how far its tick labels reach over its top and under its bottom.
export function extentY(y, options = {}, side = "left") {
  const {tickSize = 6, tickPadding = 3, tickRotate = 0} = options;
  const scale = scaleOf(y);
  const [top, bottom] = extentOf(y.range);
  const count = countOf(options, bottom - top, 35);
  const ticks = ticksOf(scale, options, count);
  const format = formatOf(scale, options, count);
  const labels = ticks.map(format);
  const radians = (tickRotate * Math.PI) / 180;
  const [{textAlign, textBaseline}, pad] = rotatedY(tickRotate, side === "right");
  const reach = reachOf(labels, {tickSize, tickPadding, radians, pad, across: acrossY});
  // Along the axis, a label spans its box turned around its anchor at its tick, such as one turned
  // by -45° and ending at its tick, which reaches down from it.
  const Y = positionOf(scale);
  let [start, end] = [0, 0];
  ticks.forEach((d, i) => {
    const label = `${labels[i] ?? ""}`;
    if (label === "") return;
    const [, , y0, y1] = boxOf(widthOf(label), font.fontSize, radians, textAlign, textBaseline);
    start = Math.max(start, top - (Y(d) + y0));
    end = Math.max(end, Y(d) + y1 - bottom);
  });
  return {reach, start, end};
}

// What the axes of a chart draw past its frame at the top and on the right, by the guides of its
// context, with their titles, for the legends of a grid of cells nested in it, which go past them.
// Like Plot's, only the first side of an axis has a title: a title of x over a top axis, a level
// title of y at the top, in the row of the title of x, and a title of y turned past a right axis.
// A nested chart draws no titles.
export function outerReach(scales, guides, frame) {
  const {x, y} = scales;
  const titled = (record, axis, options, turned) =>
    !frame?.nested && labelOf(record, scaleOf(record), axis, options, turned) != null;
  const anchorsX = (x && guides?.x?.anchors) || [];
  const anchorsY = (y && guides?.y?.anchors) || [];
  const reachX = anchorsX.includes("top") ? extentX(x, guides.x, "top").reach : 0;
  let top = reachX;
  if (anchorsX[0] === "top" && titled(x, "x", guides.x)) top += titleGap + font.fontSize;
  let right = anchorsY.includes("right") ? extentY(y, guides.y, "right").reach : 0;
  if (anchorsY.length) {
    const {labelAnchor = scaleOf(y).ticks ? "top" : "center"} = guides.y;
    const turned = labelAnchor === "center" || (labelAnchor === "top" && hasTopLegend(guides, scales));
    if (turned && anchorsY[0] === "right" && titled(y, "y", guides.y, true)) right += titleGap + font.fontSize;
    if (!turned && labelAnchor === "top" && titled(y, "y", guides.y)) {
      const past = reachX || font.fontSize / 2;
      top = Math.max(top, past + titleGap + font.fontSize);
    }
  }
  return {top, right};
}

// The positions of an axis, following a grid of cells nested in its chart, if it was scaled to keep
// room at its edges, such as for the legends of facets; see gridFrames.
function warped(record, position) {
  const {warp} = record;
  return warp ? (d) => warp(position(d)) : position;
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
  const {tickSize = 6, tickPadding = 3, tickRotate = 0, grid = false, anchor = "bottom", layer} = options;
  const {height} = flow.renderer()._props;
  const scale = scaleOf(x);
  const [left, right] = extentOf(x.range);
  const [top, bottom] = frame ? [frame.top, frame.bottom] : y ? extentOf(y.range) : [0, height];
  const count = countOf(options, right - left, 80);
  const ticks = ticksOf(scale, options, count);
  const X = warped(x, positionOf(scale));
  const stroke = "currentColor";
  if (grid && layer !== "axis")
    flow.data(ticks).append(link, {key, x: X, x1: X, y: top, y1: bottom, stroke, strokeOpacity: 0.1});
  // In facets, only the cells along the anchor label x; nested charts leave titles to the outer chart.
  // An implicit axis draws its grid and the rest in two layers, under and over the shapes.
  if (layer === "grid" || (frame?.edges && !frame.edges[anchor])) return;
  const isTop = anchor === "top";
  // The edge may be moved in to a grid of cells nested in the chart, past their legends; see gridFrames.
  const [edge, k] = isTop ? [x.edges?.top ?? top, -1] : [bottom, 1];
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
  // axis; with labelAnchor, it's at its left or right end, or its middle. The margins of cm.plane
  // fit what its axes draw, measured with extentX; an axis added explicitly with other options, or
  // one drawn by a nested chart, needs a margin given to cm.plane.
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
  const {tickSize = 6, tickPadding = 3, tickRotate = 0, grid = false, anchor = "left", layer} = options;
  const {width} = flow.renderer()._props;
  const scale = scaleOf(y);
  const [left, right] = frame ? [frame.left, frame.right] : x ? extentOf(x.range) : [0, width];
  const [top, bottom] = extentOf(y.range);
  const count = countOf(options, bottom - top, 35);
  const ticks = ticksOf(scale, options, count);
  const Y = warped(y, positionOf(scale));
  const stroke = "currentColor";
  if (grid && layer !== "axis")
    flow.data(ticks).append(link, {key, x: left, x1: right, y: Y, y1: Y, stroke, strokeOpacity: 0.1});
  // In facets, only the cells along the anchor label y; nested charts leave titles to the outer chart.
  // An implicit axis draws its grid and the rest in two layers, under and over the shapes.
  if (layer === "grid" || (frame?.edges && !frame.edges[anchor])) return;
  const isRight = anchor === "right";
  const [edge, k] = isRight ? [y.edges?.right ?? right, 1] : [left, -1];
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
  // level at the top of the axis, the default of a continuous scale, or at its bottom, starting 3px
  // from the left edge of the chart on a left axis, or ending 3px from its right edge on a right
  // one, like Plot's, which aligns it with the edge of the margin, with an arrow along the axis; or
  // turned to read along it at its middle, the default of a discrete scale, past its tick labels,
  // else its tick marks, else the plot. The margins of cm.plane fit it, as for x. Under a legend at the top of the chart, a title at the top is turned too,
  // ending at the top of the axis, so that it leaves the top to the legend.
  const {labelAnchor = scale.ticks ? "top" : "center"} = options;
  const turn = labelAnchor === "center" || (labelAnchor === "top" && hasTopLegend(guides, scales));
  const label = labelOf(y, scale, "y", options, turn);
  if (label == null || frame?.nested) return;
  if (!turn) {
    // Over the top or under the bottom of the axis, past the half of a tick label that may reach
    // past it, or past the tick labels of an axis of x on that side, in the row of its title.
    const isBottom = labelAnchor === "bottom";
    const side = isBottom ? "bottom" : "top";
    const past = x && guides?.x?.anchors?.includes(side) ? extentX(x, guides.x, side).reach : font.fontSize / 2;
    flow.datum(label).append(text, {
      ...font,
      text: label,
      x: isRight ? width - 3 : 3,
      // At the top, in the row of the title of x, which may move in to a grid nested in the chart.
      y: isBottom ? bottom + past + titleGap : (x?.edges?.top ?? top) - past - titleGap,
      textAlign: isRight ? "end" : "start",
      textBaseline: isBottom ? "top" : "bottom",
    });
    return;
  }
  const reach = reachOf(ticks.map(format), {
    tickSize,
    tickPadding,
    radians: (tickRotate * Math.PI) / 180,
    pad: padY,
    across: acrossY,
  });
  const [labelY, textAlign] = labelAnchor === "top" ? [top, "end"] : [(top + bottom) / 2, "center"];
  flow.datum(label).append(text, {
    ...font,
    text: label,
    x: edge + k * (reach + titleGap),
    y: labelY,
    rotate: -Math.PI / 2,
    textAlign,
    // Turned a quarter counterclockwise, the text sits left of its point, or right of it.
    textBaseline: isRight ? "top" : "bottom",
  });
}

// Whether a chart draws a legend at its top, from its guides, for a scale it has.
function hasTopLegend(guides, scales) {
  return Object.entries(guides?.legends ?? {}).some(([key, {anchor}]) => anchor !== "right" && scales[key]);
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
